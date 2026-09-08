// Hermes Task Intent Router — runs inside n8n as a Code node.
// Parses the Telegram update, classifies intent, routes to the right workflow branch.

const TELEGRAM = {
  /** Convert a Telegram update into a plain object n8n can route on. */
  parse(update) {
    const msg = update.message || update.edited_message || update.callback_query?.message;
    const fromId = msg?.from?.id ?? update.callback_query?.from?.id ?? null;
    const chatId = msg?.chat?.id ?? update.callback_query?.message?.chat?.id ?? null;
    const text = (msg?.text ?? update.callback_query?.data ?? msg?.caption ?? '').toString().trim() || '';

    let command = null;
    let intent = 'chat'; // default: natural chat

    if (text) {
      if (text.startsWith('/')) {
        const firstWord = text.split(/\s+/)[0].toLowerCase();
        command = firstWord;
        if (firstWord === '/status') intent = 'status';
        else if (firstWord === '/blockers') intent = 'blockers';
        else if (firstWord === '/next') intent = 'next';
        else if (firstWord === '/continue') intent = 'continue';
        else if (firstWord === '/plan') intent = 'plan';
        else if (firstWord === '/report') intent = 'report';
        else if (firstWord === '/help') intent = 'help';
        else intent = 'chat';
      }
    }

    return {
      update,
      fromId: fromId ? String(fromId) : null,
      chatId: chatId ? String(chatId) : null,
      text,
      command,
      intent,
      raw: msg
    };
  },

  /** Fast keyword pre-filter for intent. OpenAI does the real classification later. */
  hintIntent(text) {
    const lower = text.toLowerCase();
    if (/status|how.?s?.?it|what.?s?.?built|check|overview/i.test(lower)) return 'status';
    if (/blocker|stuck|waiting|problem|trouble|issue|broken/i.test(lower)) return 'blockers';
    if (/next|what should i build|continue|keep going|after this/i.test(lower)) return 'next';
    if (/plan|hermes task|format this|standard format|GOAL:|FILES:/i.test(lower)) return 'plan';
    if (/fix|broken|error|fail|bug|not working|doesn.?t work/i.test(lower)) return 'fix';
    if (/build|create|make|add|implement|write code|write a/i.test(lower)) return 'build';
    if (/review|check this|look at|audit|inspect|is this ok/i.test(lower)) return 'review';
    if (/report|summary|what did you do|done|did it work/i.test(lower)) return 'report';
    return 'chat';
  }
};

/** Map intent to n8n workflow branch output index.
 *  Outputs:
 *    0 = status      (call AngelOS overview API)
 *    1 = blockers    (OpenAI blockers prompt)
 *    2 = next        (OpenAI next-task prompt)
 *    3 = continue    (OpenAI context-aware)
 *    4 = plan        (OpenAI Hermes task format)
 *    5 = build       (create Hermes task → trigger builder)
 *    6 = fix         (create Hermes task → trigger builder)
 *    7 = review      (create Hermes task → trigger builder)
 *    8 = report      (OpenAI formatting)
 *    9 = chat        (OpenAI general chat)
 *   10 = help        (canned help reply)
 */
function intentToOutputIndex(intent, command) {
  switch (intent) {
    case 'status':  return 0;
    case 'blockers': return 1;
    case 'next':     return 2;
    case 'continue': return 3;
    case 'plan':     return 4;
    case 'build':    return 5;
    case 'fix':      return 6;
    case 'review':   return 7;
    case 'report':   return 8;
    case 'help':     return 10;
    default:         return 9;
  }
}

/** System prompt for OpenAI chat node, tuned per intent. */
function chatPrompt(intent) {
  const base = `# You are the AngelOS Planner Agent, talking to Angel via Telegram.
# Telegram is a temporary bridge — NOT the final AngelOS UI.
# AngelOS is the final private owner control center.
#
# When you recommend a build task, use the Hermes format:
#   GOAL: <one line>
#   FILES: <files>
#   AREA: <area>
#   BUILD: <numbered steps with file:line anchors>
#   TEST: <exact commands + expected PASS criteria>
#   DO NOT: <what stays off>
#   SUCCESS: <green criteria>
#   NEXT IF GREEN: <after>
#
# NEVER expose credentials. NEVER deploy/publish/send real messages.
# NEVER build a second AngelOS. NEVER touch real clients or old live LINE workflow.
# If something needs live state you can't see, ask Angel to run a command and paste it.
# Be concise. Bullet points over paragraphs.`;

  switch (intent) {
    case 'status':
      return base + `\n\nAngel asked for STATUS. Give a concise summary of what's built, what's pending, active blockers, and what's waiting on Angel. Tell Angel to check the repo (BUILD_STATUS.md) if unsure about live state.`;
    case 'blockers':
      return base + `\n\nAngel asked for BLOCKERS. List what's blocking progress. Separate: blocked on Angel (credentials, decisions), blocked on code gaps, blocked on environment. For each, say what would unblock it.`;
    case 'next':
      return base + `\n\nAngel asked for the NEXT task. Recommend ONE highest-priority buildable task in Hermes format. Priority order: 1) finish current highest-priority buildable connection, 2) LINE outbound, 3) Meta inbound/outbound, 4) content approval→publish, 5) booking journey, 6) shared owner-action layer, 7) system status, 8) Telegram Planner Bot.`;
    case 'continue':
      return base + `\n\nAngel said CONTINUE — they finished a task and want the next one. Ask what they just finished if unclear, then recommend the next task in Hermes format.`;
    case 'plan':
      return base + `\n\nAngel wants a planned task in Hermes format. Output ONLY the Hermes task spec. If unclear, ask clarifying questions first.`;
    case 'build':
      return base + `\n\nAngel wants to BUILD something. This will go to Hermes Builder. Help Angel refine the request into a clear Hermes task spec first.`;
    case 'fix':
      return base + `\n\nAngel wants to FIX something. Help them describe what's broken, expected vs actual, and steps to reproduce. Then send to Hermes Builder.`;
    case 'review':
      return base + `\n\nAngel wants a REVIEW. Help them describe what to review and what they're concerned about. Then send to Hermes Builder.`;
    case 'report':
      return base + `\n\nAngel wants to format a REPORT. Format it as: DONE: <what was done>, TESTS: <results>, FILES: <files touched>, VERIFIED: <proven>, NOT VERIFIED: <not proven>, NEXT: <next step>. Keep it short.`;
    default:
      return base + `\n\nChat naturally with Angel. When a build/fix/review idea comes up, offer to send it to Hermes Builder.`;
  }
}

/** Format the user message for OpenAI with intent context. */
function formatUserMessage(intent, text) {
  const context = {
    status: 'Angel asked: "What\'s the status?"',
    blockers: 'Angel asked: "What\'s blocking progress?"',
    next: 'Angel asked: "What should I build next?"',
    continue: 'Angel said: "Continue"',
    plan: 'Angel wants a planned task.',
    build: 'Angel wants to build something.',
    fix: 'Angel wants to fix something.',
    review: 'Angel wants a review.',
    report: 'Angel wants to format a report.',
  }[intent] ?? `Angel said: "${text}"`;

  return `${context}\n\nAngel's message:\n${text}`;
}

/** Build the payload for creating a Hermes task in AngelOS via the API. */
function makeTaskPayload(workspaceId, sourceRef, intent, text, parsedJson, n8nExecutionId, callbackUrl) {
  return {
    source_ref: sourceRef,
    source: 'telegram',
    source_channel: 'telegram',
    intent,
    task_text: text,
    task_json: parsedJson,
    needs_owner_approval: false,
    n8n_execution_id: n8nExecutionId,
    n8n_callback_url: callbackUrl
  };
}

// n8n Code node exports — these are called by n8n's expression system
return {
  parse: TELEGRAM.parse,
  hintIntent: TELEGRAM.hintIntent,
  intentToOutputIndex,
  chatPrompt,
  formatUserMessage,
  makeTaskPayload
};
