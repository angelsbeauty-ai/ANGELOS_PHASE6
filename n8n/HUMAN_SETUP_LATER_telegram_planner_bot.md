# Human Setup Later — Telegram Planner Bot

This bot is a TEMPORARY remote-control channel so Angel can talk to Hermes while away from the laptop. Telegram is NOT AngelOS, NOT the final UI, NOT the approval center. AngelOS is the final private owner control center.

## What's built (code-side, ready)

- `n8n/angelos-planner-bot-workflow.json` — portable n8n workflow (Telegram trigger → Angel-only guard → command router → OpenAI + canned replies → Telegram reply)
- `n8n/angelos-planner-system-instructions.md` — full OpenAI system instructions for the Planner Agent
- `n8n/angelos-planner-bot-worker.js` — n8n Code node worker (Angel-only enforcement, command dispatch)

The workflow has:
- /status, /help, /blockers — canned replies (no OpenAI needed)
- /next, /continue, /report, /plan, /chat — OpenAI chat node (uses system instructions + Angel's message)

## What Angel must personally do

### 1. BotFather — create the Telegram bot

1. Open Telegram → @BotFather → `/newbot`
2. Name it (e.g. "AngelOS Planner"), give it a username (e.g. `AngelOSPlannerBot`)
3. Copy the bot token
4. **Do NOT paste the bot token in chat.** Store it in n8n (step 3) or your OS env.

### 2. Set up n8n credentials

Create/configure these credentials in n8n:

- **Telegram Bot API** — paste the BotFather token. Name: `AngelOS Planner Telegram Bot` (must match workflow JSON: `AngelOS-Planner-Telegram-Bot`)
- **OpenAI API** — reuse the existing OpenAI credential if available. Name: `AngelOS OpenAI` (must match: `AngelOS-OpenAI`)
- **Text credential: AngelOS-Planner-Angel-UserId** — your Telegram numeric user ID (e.g. `123456789`). Find it via @userinfobot on Telegram.

To find your Telegram user ID:
- Message @userinfobot on Telegram — it tells you your ID.
- Or use a bot/forward that echoes user IDs.

### 3. Set the Angel user ID via env (optional alternative)

Set `ANGELOS_PLANNER_ANGEL_TELEGRAM_USER_ID=<your numeric Telegram user ID>` on the n8n host/process. The env var takes precedence if both it and the n8n credential are set.

### 4. Import the workflow into n8n

1. In n8n: Workflows → Import from File → select `n8n/angelos-planner-bot-workflow.json` from ANGELOS_PHASE6
2. Connect the credentials (step 2) to the nodes
3. **Important:** the OpenAI node's System Message references `n8n/angelos-planner-system-instructions.md` — but n8n can't read the repo file at runtime. Either:
   - Copy the system instructions file contents into the OpenAI node's System Message field, OR
   - Make sure n8n can read the file (same machine, correct path)

### 5. Activate the workflow

1. Review nodes — confirm credential names match
2. Toggle Active
3. The Telegram Trigger starts listening

### 6. Test (safe — no real sends, no deploy, no publish)

1. Telegram → your new bot → send `/help` → should get help message
2. `/status` → canned status reply
3. `/blockers` → canned blockers reply
4. Any non-command message → goes to OpenAI, comes back as chat reply
5. `/next` → canned "need state first" reply (or OpenAI if you include context)
6. Verify: message from anyone else → "This bot is for Angel only."

## What the bot does NOT do

- Does NOT deploy, publish, or send real messages
- Does NOT touch real clients or the old live LINE workflow
- Does NOT build a second AngelOS
- Does NOT read live n8n or Supabase state (unless you paste it)
- Does NOT expose Telegram bot token or OpenAI credentials

## Current blocker

n8n is not reachable from this machine right now (port 5678 refused). The workflow JSON + system instructions + worker + setup doc are all built and ready in the repo. Once n8n is running and reachable, Angel imports the workflow, connects credentials, and the bot is live in Telegram.

## If something's wrong

Send the exact n8n workflow error (if any), the Telegram error (if any), and whether n8n is running/reachable. I can fix the workflow from the logs — I just can't do BotFather or n8n credential steps for you.
