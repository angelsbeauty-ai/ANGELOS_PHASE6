# AngelOS Planner Bot — Human Setup Later

The AngelOS Planner Bot is a Telegram bot that runs in n8n and talks to Angel via OpenAI. It helps Angel plan work, check status, and prepare the next Hermes Builder task.

**IMPORTANT:** Telegram is a TEMPORARY remote-control channel. It is NOT AngelOS, not the final UI, not the approval center. AngelOS is the final private owner control center.

---

## What's built

- `n8n/angelos-planner-system-instructions.md` — full OpenAI system instructions for the Planner Agent
- `n8n/angelos-planner-bot-worker.js` — the n8n Code node worker that enforces Angel-only access and dispatches commands
- `n8n/angelos-planner-bot-workflow.json` — the n8n workflow (portable import)

The workflow has:
- Telegram Trigger (receives messages)
- Angel-only guard (Code node — rejects non-Angel users)
- Command router (switch node — routes /status, /next, /continue, /blockers, /report, /help, /plan, /chat)
- Canned replies for /status, /help, /blockers (no OpenAI needed)
- OpenAI Chat node for /next, /continue, /report, /plan, /chat (uses system instructions + Angel's message)
- Telegram reply nodes (send the response)

---

## What Angel must do

### 1. Start n8n (if not already running)

n8n must be running and reachable. If n8n is not running:
- Start it locally (or on your host) per your normal n8n setup.
- Confirm the API is reachable: `curl http://127.0.0.1:5678/api/status`

If you run n8n somewhere other than `127.0.0.1:5678`, update the workflow's HTTP references accordingly.

### 2. Create the Telegram bot (BotFather)

1. Open Telegram, find **@BotFather**.
2. Send `/newbot`.
3. Follow the prompts: name it something like "AngelOS Planner", give it a username like `AngelOSPlannerBot` or similar.
4. BotFather will give you a **bot token**. Copy it.

**Do NOT paste the bot token into chat with me.** Store it in n8n (step 3) or your OS environment.

### 3. Set up n8n credentials

In n8n, create/configure these credentials:

**a) Telegram Bot API credential**
- Type: Telegram Bot API
- Paste the bot token from step 2.
- Name it: `AngelOS Planner Telegram Bot` (must match the credential name referenced in the workflow JSON: `AngelOS-Planner-Telegram-Bot`)

**b) OpenAI API credential**
- Type: OpenAI API
- Use the existing OpenAI credential if one is already stored in n8n.
- If there is no existing OpenAI credential, create one with your OpenAI API key.
- Name it: `AngelOS OpenAI` (must match the workflow JSON: `AngelOS-OpenAI`)

**c) Angel Telegram User ID credential (text)**
- Type: Text (or whatever n8n calls a single-value text credential)
- Name it: `AngelOS-Planner-Angel-UserId`
- Value: your Telegram user ID (a number, e.g. `123456789`)

To find your Telegram user ID:
- Talk to **@userinfobot** on Telegram — it will tell you your ID.
- Or forward a message from yourself to a bot that echoes user IDs.

### 4. Import the workflow into n8n

1. In n8n, go to **Workflows** → **Import from File** (or "+ New" → "Import from File").
2. Select `n8n/angelos-planner-bot-workflow.json` from the ANGELOS_PHASE6 repo.
3. n8n will prompt you to connect the credentials — select the ones you created in step 3.
4. The workflow references `/status`, `/help`, /blockers canned replies inline. The OpenAI node references the system instructions file, but n8n can't read the repo file at runtime — you'll need to either:
   - Copy the contents of `n8n/angelos-planner-system-instructions.md` into the OpenAI node's System Message field, OR
   - Keep the file reference and make sure the n8n instance can read it (e.g. if n8n runs on the same machine as the repo).

### 5. Set the Angel Telegram user ID env var (optional)

If you prefer to set the Angel user ID via environment variable instead of the n8n credential:

- Set `ANGELOS_PLANNER_ANGEL_TELEGRAM_USER_ID=<your numeric Telegram user ID>` on the n8n host/process.

If both the env var and the n8n credential are set, the env var takes precedence.

### 6. Activate the workflow

1. In n8n, open the imported workflow.
2. Review the nodes — make sure the credential names match what you created.
3. Toggle the workflow **Active**.
4. The Telegram Trigger node will start listening for messages to your bot.

### 7. Test it (safe — no real sends, no deploy, no publish)

1. Open Telegram, find your new bot.
2. Send `/help` — you should get the help message.
3. Send `/status` — you should get the canned status reply.
4. Send `/blockers` — you should get the canned blockers reply.
5. Send a non-command message — it should go to OpenAI and come back as a chat reply.
6. Send `/next` — you should get the canned "I need state first" reply (or an OpenAI-generated one if you include context).

If anyone else messages the bot, they should get "This bot is for Angel only."

---

## What the bot does NOT do

- Does NOT deploy, publish, or send real messages
- Does NOT touch real clients or the old live LINE workflow
- Does NOT build a second AngelOS
- Does NOT read live n8n or Supabase state (unless you paste it into chat)
- Does NOT expose Telegram bot token or OpenAI credentials

---

## If something's wrong

Send AngelOS (me) the exact details:
- What step you were on
- The n8n workflow error (if any)
- The Telegram error (if any)
- Whether n8n is running and reachable

I can read logs and fix the workflow from there. I just can't do the BotFather or n8n credential steps for you.
