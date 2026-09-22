#!/usr/bin/env node
/**
 * angelos-hermes-worker.js
 * Local Windows worker for the Hermes execution bridge.
 *
 * Architecture:
 *   Railway/n8n → POST /hermes/n8n/tasks (creates hermes_tasks row, status='queued')
 *   Worker polls Supabase hermes_tasks for claimable tasks
 *   Worker atomically claims one task (status → in_progress, sets n8n_execution_id)
 *   Worker executes the task intent against the local ANGELOS_PHASE6 repo
 *   Worker records result in Supabase (status, hermes_result, hermes_error, timestamps)
 *   n8n /status command reads result via GET /hermes/n8n/overview
 *
 * No public ports. No tunnel. Worker uses Supabase service-role key.
 * Destructive actions protected by existing operating rules (see SAFETY_GATES below).
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const crypto = require('node:crypto');

// ---------------------------------------------------------------------------
// CONFIG — loaded from env, with safe defaults for local dev
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const POLL_INTERVAL_MS = Number(process.env.HERMES_WORKER_POLL_MS ?? 10000);
const WORKER_ID = process.env.HERMES_WORKER_ID ?? `windows-worker-${crypto.randomUUID().slice(0, 8)}`;
const REPO_PATH = process.env.ANGELOS_REPO_PATH ||
  path.join(process.env.USERPROFILE || process.env.HOME || '', 'dev', 'ANGELOS_PHASE6');
const ANGELOS_API_URL = process.env.ANGELOS_API_URL ||
  'https://angelosapi-staging.up.railway.app';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';   // optional — used only if AI_PROVIDER_MODE=openai
const AI_PROVIDER_MODE = process.env.AI_PROVIDER_MODE ?? 'mock';
const DEFAULT_TIMEOUT_MS = Number(process.env.HERMES_WORKER_TIMEOUT_MS ?? 300000);
const DRY_RUN = process.env.HERMES_WORKER_DRY_RUN === 'true'; // safety: set true to log-only

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[hermes-worker] ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// SAFETY GATES (never disabled by env)
// ---------------------------------------------------------------------------
// These are hard-coded to match the operating rules in this branch:
//   - No production deployments
//   - No real LINE/Meta sends
//   - No content publishing
//   - No billing mutations
//   - No touches to the old live LINE workflow
//
// Tasks with these keywords in task_text are blocked even if intent is 'build/fix/review'.
const BLOCKED_KEYWORDS = [
  'deploy', 'publish', 'send to client', 'live message',
  'billing', 'charge', 'payment', 'Facebook broadcast',
  'Instagram broadcast', 'LINE broadcast', 'production deploy',
  'push to production', 'go live'
];

// ---------------------------------------------------------------------------
// Supabase client (service-role — full access, bypasses RLS)
// ---------------------------------------------------------------------------

let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
} catch (e) {
  console.error('[hermes-worker] Failed to create Supabase client:', e.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Claim a task atomically
// Returns the claimed task row, or null if nothing to do.
// ---------------------------------------------------------------------------

async function claimTask() {
  // Claim the oldest queued/assigned/in_progress task that is NOT already
  // claimed by THIS worker (n8n_execution_id does not start with our prefix).
  const { data, error } = await supabase
    .rpc('hermes_claim_task', {
      p_worker_id: WORKER_ID,
      p_repo_path: REPO_PATH
    })
    .single();

  if (error) {
    // Fallback: rpc may not exist yet — do an atomic update via .update().
    console.warn('[hermes-worker] RPC hermes_claim_task not found, using fallback claim.');
    return claimTaskFallback();
  }

  if (!data) return null;
  return data;
}

async function claimTaskFallback() {
  // Select one task that is claimable
  const { data: candidates, error: selectError } = await supabase
    .from('hermes_tasks')
    .select('*')
    .or(`status.eq.queued,status.eq.assigned,status.eq.in_progress`)
    .not(`n8n_execution_id`, 'eq', `worker-${WORKER_ID}`)
    .order('created_at', { ascending: true })
    .limit(1);

  if (selectError) {
    console.error('[hermes-worker] Failed to query tasks:', selectError.message);
    return null;
  }
  if (!candidates || candidates.length === 0) return null;

  const task = candidates[0];

  // Atomically claim: set status=in_progress + n8n_execution_id=worker-id + started_at
  const now = new Date().toISOString();
  const execId = `worker-${WORKER_ID}-${Date.now()}`;
  const { data: claimed, error: updateError } = await supabase
    .from('hermes_tasks')
    .update({
      status: 'in_progress',
      n8n_status: 'in_progress',
      n8n_execution_id: execId,
      hermes_started_at: now,
      updated_at: now
    })
    .eq('id', task.id)
    .eq('status', task.status) // optimistic lock — only succeeds if status unchanged
    .select()
    .single();

  if (updateError || !claimed) {
    // Another worker claimed it between our select and update — skip
    return null;
  }

  return claimed;
}

// ---------------------------------------------------------------------------
// Task execution dispatchers
// ---------------------------------------------------------------------------

function isBlockedBySafetyGates(taskText) {
  const lower = taskText.toLowerCase();
  const hits = BLOCKED_KEYWORDS.filter(k => lower.includes(k));
  return hits;
}

async function executeStatusTask(task) {
  // status/overview: query the API overview endpoint, return result
  const url = `${ANGELOS_API_URL}/workspaces/${task.workspace_id}/hermes/n8n/overview`;
  let result;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'X-N8N-Secret': process.env.N8N_HERMES_SECRET || '' }
    });
    const json = await res.json();
    result = {
      success: res.ok,
      status: res.ok ? 'done' : 'failed',
      data: json,
      error: res.ok ? undefined : (json.message || `HTTP ${res.status}`)
    };
  } catch (e) {
    result = { success: false, status: 'failed', error: e.message };
  }
  return {
    status: result.success ? 'done' : 'failed',
    hermes_result: result.data || { summary: result.error },
    hermes_error: result.error,
    files_changed: [],
    summary: result.success
      ? `Status retrieved from AngelOS API. Pending approvals: ${result.data?.pendingApprovals ?? '?'}, Needs attention: ${result.data?.needsAttention ?? '?'}.`
      : `Status query failed: ${result.error}`,
    test_result: { status: result.success ? 'passed' : 'failed', passed: result.success ? 1 : 0, failed: result.success ? 0 : 1 }
  };
}

async function executeBuildFixReviewTask(task) {
  // The REAL execution path: run a safe, non-destructive operation in the local repo.
  // For build intent: run `npm run build:api` (compile check, no deploy).
  // For fix intent: run `npm run verify:static` (lint + migration check).
  // For review intent: run `npm run typecheck` (type check).
  //
  // These are read-only or build-artifact operations — they do NOT deploy,
  // push, send messages, or modify production data.
  //
  // If ANGELOS_REPO_PATH does not exist or is not a git repo, return a clear error.

  if (!fs.existsSync(REPO_PATH)) {
    throw new Error(`ANGELOS_REPO_PATH does not exist: ${REPO_PATH}`);
  }
  if (!fs.existsSync(path.join(REPO_PATH, '.git'))) {
    throw new Error(`ANGELOS_REPO_PATH is not a git repository: ${REPO_PATH}`);
  }

  const intent = task.intent;
  let command = [];
  let description = '';

  if (intent === 'build') {
    command = ['npm', 'run', 'build:api'];
    description = 'npm run build:api (compile check)';
  } else if (intent === 'fix') {
    command = ['npm', 'run', 'verify:static'];
    description = 'npm run verify:static (lint + migration + secret check)';
  } else if (intent === 'review') {
    command = ['npm', 'run', 'typecheck'];
    description = 'npm run typecheck (TypeScript type check across workspaces)';
  } else {
    // fallback: treat as build
    command = ['npm', 'run', 'build:api'];
    description = 'npm run build:api (fallback for intent: ' + intent + ')';
  }

  if (DRY_RUN) {
    return {
      status: 'done',
      hermes_result: { dry_run: true, command: command.join(' '), would_run_in: REPO_PATH },
      hermes_error: undefined,
      files_changed: [],
      summary: `[DRY RUN] Would execute: ${description} in ${REPO_PATH}. Set HERMES_WORKER_DRY_RUN=false to run for real.`,
      test_result: { status: 'passed', passed: 1, failed: 0 }
    };
  }

  // Execute in the repo directory
  const originalCwd = process.cwd();
  try {
    process.chdir(REPO_PATH);

    // Pre-flight: check git status (read-only, safe)
    let gitStatusOutput = '';
    try {
      gitStatusOutput = execSync('git status --porcelain', {
        encoding: 'utf8',
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
    } catch {
      gitStatusOutput = '(git status unavailable)';
    }
    const filesBefore = gitStatusOutput ? gitStatusOutput.split('\n').filter(Boolean) : [];

    // Run the command
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let exitCode = -1;
    try {
      const result = execSync(command.join(' '), {
        encoding: 'utf8',
        timeout: DEFAULT_TIMEOUT_MS,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, OPENAI_API_KEY: OPENAI_API_KEY || process.env.OPENAI_API_KEY || '' }
      });
      stdout = result;
      exitCode = 0;
    } catch (e) {
      stdout = e.stdout || '';
      stderr = e.stderr || e.message;
      exitCode = e.status || -1;
    }
    const durationMs = Date.now() - startTime;

    // Post-flight: check git status again to detect files_changed
    let gitStatusOutputAfter = '';
    try {
      gitStatusOutputAfter = execSync('git status --porcelain', {
        encoding: 'utf8',
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
    } catch {
      gitStatusOutputAfter = '';
    }
    const filesAfter = gitStatusOutputAfter ? gitStatusOutputAfter.split('\n').filter(Boolean) : [];
    const filesChanged = filesAfter.filter(f => !filesBefore.includes(f));

    const passed = exitCode === 0;
    const testResult = {
      status: passed ? 'passed' : 'failed',
      passed: passed ? 1 : 0,
      failed: passed ? 0 : 1
    };

    return {
      status: passed ? 'done' : 'failed',
      hermes_result: {
        command: command.join(' '),
        description,
        exit_code: exitCode,
        duration_ms: durationMs,
        stdout: stdout.slice(0, 8000),
        stderr: stderr.slice(0, 2000),
        git_status_before: filesBefore,
        git_status_after: filesAfter,
        files_changed: filesChanged
      },
      hermes_error: passed ? undefined : stderr.slice(0, 2000),
      files_changed: filesChanged,
      summary: passed
        ? `✅ ${description} completed in ${durationMs}ms. Exit code: 0. Files changed: ${filesChanged.length}.`
        : `❌ ${description} failed. Exit code: ${exitCode}. See stderr for details.`,
      test_result: testResult
    };
  } finally {
    process.chdir(originalCwd);
  }
}

async function executeChatTask(task) {
  // chat intent: no execution needed, just acknowledge
  return {
    status: 'done',
    hermes_result: { acknowledged: true, task_text: task.task_text },
    hermes_error: undefined,
    files_changed: [],
    summary: `Task acknowledged: "${task.task_text.slice(0, 120)}". No execution required for chat intent.`,
    test_result: { status: 'passed', passed: 1, failed: 0 }
  };
}

async function executeUnknownIntentTask(task) {
  return {
    status: 'failed',
    hermes_result: { intent: task.intent },
    hermes_error: `Unknown intent: ${task.intent}. Supported: build, fix, review, status, overview, chat.`,
    files_changed: [],
    summary: `Task not executed: unsupported intent "${task.intent}".`,
    test_result: { status: 'failed', passed: 0, failed: 1 }
  };
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function runOnce() {
  const task = await claimTask();
  if (!task) {
    console.log(`[hermes-worker] No claimable tasks. Polling again in ${POLL_INTERVAL_MS}ms...`);
    return;
  }

  console.log(`[hermes-worker] Claimed task ${task.id} (intent=${task.intent}, source_ref=${task.source_ref})`);

  // Safety gate: check for blocked keywords in task_text
  if (task.task_text) {
    const hits = isBlockedBySafetyGates(task.task_text);
    if (hits.length > 0) {
      const now = new Date().toISOString();
      await supabase
        .from('hermes_tasks')
        .update({
          status: 'failed',
          hermes_error: `Safety gate blocked: task contains "${hits.join(', ')}". This worker does not execute production deploys, publishes, sends, or billing mutations.`,
          hermes_finished_at: now,
          n8n_status: 'failed',
          updated_at: now
        })
        .eq('id', task.id)
        .select()
        .single();
      console.error(`[hermes-worker] BLOCKED task ${task.id}: ${hits.join(', ')}`);
      return;
    }
  }

  // Approval gate: if needs_owner_approval is true, skip execution
  if (task.needs_owner_approval) {
    const now = new Date().toISOString();
    await supabase
      .from('hermes_tasks')
      .update({
        status: 'awaiting_approval',
        n8n_status: 'awaiting_approval',
        hermes_error: 'Task requires owner approval before execution.',
        hermes_finished_at: now,
        updated_at: now
      })
      .eq('id', task.id)
      .select()
      .single();
      console.log(`[hermes-worker] Task ${task.id} requires owner approval — set to awaiting_approval.`);
      return;
  }

  const startTime = Date.now();
  let result;
  let finalStatus = 'done';

  try {
    switch (task.intent) {
      case 'status':
      case 'overview':
        result = await executeStatusTask(task);
        break;
      case 'build':
      case 'fix':
      case 'review':
        result = await executeBuildFixReviewTask(task);
        break;
      case 'chat':
        result = await executeChatTask(task);
        break;
      default:
        result = await executeUnknownIntentTask(task);
        if (result.status === 'failed') finalStatus = 'failed';
    }
  } catch (e) {
    const errorMsg = e.message ?? String(e);
    result = {
      status: 'failed',
      hermes_result: { error: errorMsg },
      hermes_error: errorMsg,
      files_changed: [],
      summary: `Task execution failed: ${errorMsg}`,
      test_result: { status: 'failed', passed: 0, failed: 1 }
    };
    finalStatus = 'failed';
  }

  const durationMs = Date.now() - startTime;

  // Record result in Supabase (service-role key)
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('hermes_tasks')
    .update({
      status: result.status === 'failed' ? 'failed' : 'done',
      hermes_result: result.hermes_result,
      hermes_error: result.hermes_error ?? null,
      hermes_finished_at: now,
      n8n_status: result.status === 'failed' ? 'failed' : 'done',
      n8n_execution_id: task.n8n_execution_id, // preserve worker's execution id
      updated_at: now
    })
    .eq('id', task.id)
    .select()
    .single();

  if (updateError) {
    console.error(`[hermes-worker] Failed to record result for task ${task.id}:`, updateError.message);
  } else {
    console.log(
      `[hermes-worker] Task ${task.id} complete: status=${result.status}, ` +
      `files_changed=${result.files_changed?.length ?? 0}, ` +
      `duration=${durationMs}ms, ` +
      `summary=${((result.summary || '').slice(0, 100))}`
    );
  }

  // If a callback URL was stored and source_channel is telegram,
  // the API's own fireCallback mechanism would handle Telegram reply —
  // but since the worker executes directly, we don't call it here.
  // The n8n /status command will read the result from Supabase via the overview endpoint.
}

async function main() {
  console.log(`[hermes-worker] Starting. Worker ID: ${WORKER_ID}`);
  console.log(`[hermes-worker] Polling Supabase every ${POLL_INTERVAL_MS}ms`);
  console.log(`[hermes-worker] Repo path: ${REPO_PATH}`);
  console.log(`[hermes-worker] Dry run: ${DRY_RUN}`);
  console.log(`[hermes-worker] ANGELOS_API_URL: ${ANGELOS_API_URL}`);
  console.log(`[hermes-worker] AI_PROVIDER_MODE: ${AI_PROVIDER_MODE}`);
  console.log(`[hermes-worker] OpenAI API key configured: ${!!OPENAI_API_KEY}`);
  console.log(`[hermes-worker] Safety gates: ${BLOCKED_KEYWORDS.join(', ')}`);

  // Verify repo exists
  if (!fs.existsSync(REPO_PATH)) {
    console.error(`[hermes-worker] WARNING: Repo path does not exist: ${REPO_PATH}`);
  } else {
    console.log(`[hermes-worker] Repo exists: ${fs.existsSync(path.join(REPO_PATH, 'package.json')) ? 'yes' : 'no package.json'}`);
  }

  // Run in a loop
  while (true) {
    try {
      await runOnce();
    } catch (e) {
      console.error('[hermes-worker] Unexpected error in run loop:', e.message);
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('[hermes-worker] Shutting down...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('[hermes-worker] Shutting down...');
  process.exit(0);
});

main().catch(e => {
  console.error('[hermes-worker] Fatal:', e.message);
  process.exit(1);
});
