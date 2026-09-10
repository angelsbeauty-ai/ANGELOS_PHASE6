import { Injectable } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';
import { AiProviderService } from '../ai/ai-provider.service';

export interface ExecuteTaskRequest {
  taskId: string;
  model?: string;
  timeoutMs?: number;
  executionId?: string;
}

export interface ExecuteTaskResult {
  success: boolean;
  taskId: string;
  status: 'done' | 'failed' | 'timeout';
  files_changed?: string[];
  summary?: string;
  test_result?: { status: string; passed: number; failed: number };
  error?: string;
  durationMs?: number;
}

function normalizeTaskId(taskId: string): string {
  const trimmed = taskId.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

@Injectable()
export class HermesBuilderExecutor {
  constructor(private readonly aiProvider: AiProviderService) {}

  /**
   * Execute a Hermes task and record the result in Supabase.
   * Also fires Telegram callback if one was stored with the task.
   */
  async execute(request: ExecuteTaskRequest): Promise<ExecuteTaskResult> {
    const supabase = createServiceSupabaseClient();
    const taskId = normalizeTaskId(request.taskId);
    const timeoutMs = request.timeoutMs ?? 300000;
    const startTime = Date.now();

    // Fetch the task
    const { data: task, error: fetchError } = await supabase
      .from('hermes_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, taskId, status: 'failed', error: 'Task not found' };
    }

    if (!['queued', 'assigned', 'in_progress'].includes(task.status)) {
      return { success: false, taskId, status: 'failed', error: `Task is in ${task.status} status, cannot execute` };
    }

    // Set to building
    const now = new Date().toISOString();
    await supabase.from('hermes_tasks').update({
      status: 'building',
      hermes_started_at: now,
      n8n_status: 'building',
      updated_at: now
    }).eq('id', taskId).select().single();

    const executionId = request.executionId ?? 'executor-' + Date.now();

    try {
      const result = await this.executeTask(task, timeoutMs, request.model);

      // Record success
      const finishTime = new Date().toISOString();
      await supabase.from('hermes_tasks').update({
        status: 'done',
        hermes_result: result,
        hermes_finished_at: finishTime,
        n8n_status: 'done',
        n8n_execution_id: executionId,
        updated_at: finishTime
      }).eq('id', taskId).select().single();

      // Fire Telegram callback if one was stored
      if (task.n8n_callback_url && task.source_channel === 'telegram') {
        this.fireCallback(task.n8n_callback_url, task, result, undefined);
      }

      return {
        success: true,
        taskId,
        status: 'done',
        files_changed: result.files_changed,
        summary: result.summary,
        test_result: result.test_result,
        durationMs: Date.now() - startTime
      };
    } catch (e: any) {
      const errorMsg = e.message ?? String(e);
      const finishTime = new Date().toISOString();

      await supabase.from('hermes_tasks').update({
        status: 'failed',
        hermes_error: errorMsg,
        hermes_finished_at: finishTime,
        n8n_status: 'failed',
        updated_at: finishTime
      }).eq('id', taskId).select().single();

      if (task.n8n_callback_url && task.source_channel === 'telegram') {
        this.fireCallback(task.n8n_callback_url, task, {}, errorMsg);
      }

      return { success: false, taskId, status: 'failed', error: errorMsg, durationMs: Date.now() - startTime };
    }
  }

  private async executeTask(task: any, timeoutMs: number, model?: string): Promise<{
    files_changed?: string[];
    summary: string;
    test_result?: { status: string; passed: number; failed: number };
    provider?: string;
    model?: string;
  }> {
    const request = this.aiProvider.generate({
      instructions: [
        'You are Hermes Builder, an AI software-engineering executor.',
        'Analyze the task and execute it. Return only valid JSON with this shape:',
        '{"summary":"string","files_changed":["relative/path"],"test_result":{"status":"not_run|passed|failed","passed":0,"failed":0}}.',
        'Report files_changed only for files you actually modified.',
        'Set test_result.status to "passed" only if tests ran and passed, "failed" only if tests ran and failed, otherwise "not_run".'
      ].join(' '),
      input: JSON.stringify({
        intent: task.intent,
        task_text: task.task_text,
        task_json: task.task_json ?? null
      }),
      model
    });
    const response = await this.withTimeout(request, timeoutMs);
    const parsed = this.parseBuilderResponse(response.text);

    return {
      ...parsed,
      provider: response.provider,
      model: response.model
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Hermes Builder timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private parseBuilderResponse(text: string): {
    files_changed: string[];
    summary: string;
    test_result: { status: string; passed: number; failed: number };
  } {
    const normalized = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    let value: unknown;
    try {
      value = JSON.parse(normalized);
    } catch {
      return {
        files_changed: [],
        summary: text.trim(),
        test_result: { status: 'not_run', passed: 0, failed: 0 }
      };
    }
    if (!value || typeof value !== 'object') {
      throw new Error('Hermes Builder returned an invalid result');
    }
    const result = value as Record<string, unknown>;
    const testResult = result.test_result;
    const tests = testResult && typeof testResult === 'object' ? testResult as Record<string, unknown> : {};
    return {
      files_changed: Array.isArray(result.files_changed) ? result.files_changed.filter((file): file is string => typeof file === 'string') : [],
      summary: typeof result.summary === 'string' ? result.summary : 'Hermes Builder completed without a summary.',
      test_result: {
        status: typeof tests.status === 'string' ? tests.status : 'not_run',
        passed: typeof tests.passed === 'number' ? tests.passed : 0,
        failed: typeof tests.failed === 'number' ? tests.failed : 0
      }
    };
  }

  /**
   * Fire a Telegram callback with the result.
   * The callback URL was stored when the task was created (n8n passes it).
   */
  private async fireCallback(callbackUrl: string, task: any, result: Record<string, any>, error?: string) {
    const text = this.buildTelegramText(task, result, error);
    try {
      await fetch(callbackUrl + '&text=' + encodeURIComponent(text), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      console.error('Telegram callback error:', e.message ?? String(e));
    }
  }

  private buildTelegramText(task: any, result: Record<string, any>, error?: string): string {
    if (error) return `❌ Task failed: ${error}`;

    switch (task.intent) {
      case 'build':
      case 'fix':
      case 'review': {
        const parts = ['🔨 **Hermes Build Result**', ''];
        if (result.files_changed?.length) {
          parts.push(`**Files (${result.files_changed.length}):**`);
          result.files_changed.slice(0, 10).forEach((f: string) => parts.push(`- \`${f}\``));
          if (result.files_changed.length > 10) parts.push(`- ...and ${result.files_changed.length - 10} more`);
        }
        if (result.test_result) parts.push(`**Tests:** ${result.test_result.status} (${result.test_result.passed} passed, ${result.test_result.failed} failed)`);
        if (result.summary) parts.push(result.summary);
        return parts.join('\n');
      }
      case 'status':
      case 'overview':
        return '🚦 **Status:** Build result generated. Check the AngelOS dashboard for full details.';
      default:
        return result.summary ?? '✅ Task completed. See AngelOS dashboard for details.';
    }
  }

}
