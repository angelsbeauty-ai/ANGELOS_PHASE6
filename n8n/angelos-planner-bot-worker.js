#!/usr/bin/env node
/**
 * AngelOS Planner Bot — standalone worker reference.
 *
 * This file is NOT used by the n8n workflow. It's here as a reference
 * for how the Planner Bot logic works if you ever want to run it outside
 * of n8n (e.g. as a standalone Node.js script behind your own Telegram webhook).
 *
 * The n8n workflow (angelos-planner-bot-workflow.json) has all the logic
 * built into Code nodes — it does NOT call this file.
 *
 * To use this standalone:
 *   1. Set ANGELOS_PLANNER_ANGEL_TELEGRAM_USER_ID env var to your Telegram user ID.
 *   2. Set TELEGRAM_BOT_TOKEN env var to your BotFather token.
 *   3. Run: node n8n/angelos-planner-bot-worker.js
 *   4. Point Telegram webhook to your server's /webhook path.
 *
 * But the recommended path is: import the workflow into n8n and use n8n's
 * Telegram Trigger node — it handles the webhook for you.
 */
'use strict';

// ---------------------------------------------------------------------------
// Angel-only guard
// ---------------------------------------------------------------------------
const ANGEL_TELEGRAM_USER_ID_ENV = 'ANGELOS_PLANNER_ANGEL_TELEGRAM_USER_ID';

function getAngelUserId() {
  const envVal = process.env[ANGEL_TELEGRAM_USER_ID_ENV];
  if (envVal && envVal.trim()) return envVal.trim();
  return null;
}

const ANGEL_USER_ID = getAngelUserId();

function isAngelUser(fromId) {
  if (!ANGEL_USER_ID) return null; // not configured — caller should reject
  return String(fromId) === String(ANGEL_USER_ID);
}

// ---------------------------------------------------------------------------
// Command parsing
// ---------------------------------------------------------------------------
const COMMANDS = new Set([
  '/chat', '/status', '/next', '/continue', '/blockers', '/report', '/help', '/plan'
]);

function parseUpdate(update) {
  const message = update.message || update.edited_message || update.callback_query?.message;
  const fromId = message?.from?.id ?? update.callback_query?.from?.id ?? null;
  const chatId = message?.chat?.id ?? update.callback_query?.message?.chat?.id ?? null;
  const text =
    (update.message?.text ?? update.callback_query?.data ?? update.edited_message?.text ?? '').toString().trim() || '';

  let command = null;
  if (text.startsWith('/')) {
    const firstWord = text.split(/\s+/)[0].toLowerCase();
    if (COMMANDS.has(firstWord)) command = firstWord;
    else command = '/chat';
  } else if (text) {
    command = '/chat';
  } else {
    command = null;
  }

  return { update, fromId, chatId, text, command };
}

// ---------------------------------------------------------------------------
// Replies
// ---------------------------------------------------------------------------
function replyStatus() {
  return `🚦 **AngelOS Planner — Status**

I don't have live access to the build. To get a real status, run this in Hermes and paste the result back:

- Root: ANGELOS_PHASE6
- Branch: integration/angelos-core
- Read: BUILD_STATUS.md, SELF_TEST.md
- Run: npm run build:api && npm run verify:static

Then tell me what you see.

Main areas (check BUILD_STATUS.md for the real state):
- Approvals — built / internally proven
- Bookings — built / owner confirm-cancel-complete
- Messaging core — built / internally proven
- LINE outbound — CODE READY / TRANSPORT OFF / HUMAN SETUP LATER
- Meta transport — built / dormant / NEEDS FINAL TEST
- Content publish — scaffolding exists / live adapters are Sprint 7

Safety gates (all OFF by default):
- LINE: LINE_TRANSPORT_ENABLED + LINE_STAGING_WORKSPACE_ID
- Meta: META_TRANSPORT_ENABLED + META_STAGING_WORKSPACE_ID

Nothing is live until it has been proven live.`;
}

function replyHelp() {
  return `🤖 **AngelOS Planner — Help**

I'm Angel's temporary Telegram planner assistant. I run in n8n and talk to you via Telegram.

**Commands:**
- \`/chat\` or any message — chat with me
- \`/status\` — AngelOS build status
- \`/next\` — next highest-priority buildable task
- \`/continue\` — keep going after what you just finished
- \`/blockers\` — active blockers
- \`/report\` — format a task report for Hermes
- \`/plan\` — plan a task in Hermes format
- \`/help\` — this message

**What I can do:**
- Answer questions about AngelOS
- Recommend the next Hermes task
- Format task reports
- Prepare Hermes task specs in the standard format

**What I cannot do:**
- Deploy, publish, or send real messages
- Read live n8n or Supabase state (unless you paste it)
- Touch real clients or the old live LINE workflow

**Safety:** Telegram is a temporary bridge, not the final AngelOS UI. Don't paste credentials — store them in n8n or your OS environment.`;
}

// ---------------------------------------------------------------------------
// Main dispatch
// ---------------------------------------------------------------------------
module.exports = { parseUpdate, isAngelUser, replyStatus, replyHelp };
