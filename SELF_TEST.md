# AngelOS — What You Need To Do Yourself

Exact steps, in order. Nothing here can be done for you — Meta requires your own developer login, and putting real tokens in front of me would violate the "don't store secrets you paste to me" rule you set earlier.

Your workspace ID (the only workspace in this system today): `2f420624-2422-4fc3-b00a-f697b68a877d`

---

## 0a. Approve the Railway retirement (blocking, 30 seconds)

Everything `blissful-courtesy` had has been migrated to the canonical service and verified
(staging smoke 6/6, 15/15 vars, health 200). Retiring it is irreversible, so it needs your word.

- **WHERE**: reply here.
- **DO**: say "retire blissful-courtesy" (or "keep it").
- **EXPECTED**: I take a final config snapshot, delete the service/project, re-verify canonical health.
- **STOP IF**: you are unsure whether anything else (n8n, a bookmark, an external webhook) still points at
  `blissful-courtesy-production-*.up.railway.app`. Check that first — those two URLs die with it.

## 0b. Get this branch live

Right now Railway is (probably) still deploying from `main`. This session's work is on `integration/angelos-core`. Before the webhook can respond to anything real:

- Either point Railway's `@angelos/api` service at `integration/angelos-core`, **or**
- Merge `integration/angelos-core` into `main` yourself (I have not opened a PR — you said not to touch `main` without asking).

Nothing below works until the API running on Railway actually contains this code.

## 1. Create the Meta App (one-time)

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Create App** → type "Business."
2. Add the **Instagram** product (and/or **Messenger**, if you also want Facebook Page DMs) to the app.
3. Under **App Settings → Basic**, copy the **App ID** and **App Secret**. Keep this tab open — you'll paste both in step 3.
4. Connect a Facebook Page to the app, and connect that Page to your Instagram professional account (Meta requires this link for Instagram DMs).
5. Note the **Page ID** and the **Instagram Business Account ID** — you'll need whichever one matches the account you're sending from.
6. Generate a **long-lived Page Access Token** with the `instagram_manage_messages` (and/or `pages_messaging`) permission, via Graph API Explorer or the App Dashboard's token tool. Long-lived tokens last ~60 days — note the expiry.

## 2. Pick a webhook verify token

Make up any random string — this proves the webhook request came from your own Meta app setup, not the actual signature check (that's the App Secret, separate). Example: `angelos-meta-wh-<random string>`.

## 3. Store credentials in Supabase (dashboard, not chat)

Go to your Supabase project → **Table Editor**.

**Table `integration_apps`** — insert one row:
| column | value |
|---|---|
| `workspace_id` | `2f420624-2422-4fc3-b00a-f697b68a877d` |
| `provider` | `meta` |
| `client_key` | your Meta **App ID** |
| `client_secret` | your Meta **App Secret** |
| `redirect_uri` | can be anything for now (e.g. the webhook URL below) — this build doesn't do an OAuth redirect flow yet, it's here because the column is required |

**Table `oauth_connections`** — insert one row per account you're connecting (Instagram, Facebook, or both):
| column | value |
|---|---|
| `workspace_id` | `2f420624-2422-4fc3-b00a-f697b68a877d` |
| `provider` | `instagram` or `facebook` |
| `access_token` | the long-lived Page Access Token from step 1.6 |
| `access_expires_at` | its expiry timestamp |
| `status` | `active` |

**Table `messaging_channels`** — insert one row per account (this is what makes it show up in AngelOS and is how the webhook finds the right workspace):
| column | value |
|---|---|
| `workspace_id` | `2f420624-2422-4fc3-b00a-f697b68a877d` |
| `provider` | `instagram` or `facebook` (match the row above) |
| `display_name` | whatever you want to see in the app, e.g. "Instagram DMs" |
| `external_account_id` | the **Instagram Business Account ID** or **Page ID** from step 1.5 (match provider) |
| `status` | `connected` |
| `capabilities` | `{"inbound": true, "outbound": true}` |

## 4. Set Railway environment variables

On the `@angelos/api` service in Railway:

- `META_WEBHOOK_VERIFY_TOKEN` = the string you made up in step 2.

Leave these **unset** for now — setting them is what turns on real sending:
- `META_TRANSPORT_ENABLED`
- `META_STAGING_WORKSPACE_ID`

## 5. Register the webhook with Meta

Back in the Meta App Dashboard → **Instagram** (or **Messenger**) → **Webhooks**:

- **Callback URL**: `https://angelosapi-production.up.railway.app/webhooks/meta`
- **Verify Token**: the exact same string from step 2/4.
- Click **Verify and Save**. It should succeed immediately — this only needs the code deployed and `META_WEBHOOK_VERIFY_TOKEN` set, nothing else from this list.
- Subscribe to the **messages** field.

## 6. Test inbound (safe — no real send involved)

Send a real DM to your connected Instagram/Facebook account from another account (your phone, a friend, anything).

Check it arrived:
- Supabase Table Editor → `client_messages` — a new row, `direction = inbound`.
- Open AngelOS on your phone → Messages — the conversation should appear.

If nothing shows up: check Railway's logs for the API service around the time you sent the message — the webhook either wasn't reached (Meta dashboard shows delivery failures) or was rejected (look for "Invalid signature" or "Meta webhook not configured" in the logs).

## 7. Test outbound (this is the one that sends a real message — do this deliberately)

Only after step 6 works:

1. Set `META_TRANSPORT_ENABLED=true` and `META_STAGING_WORKSPACE_ID=2f420624-2422-4fc3-b00a-f697b68a877d` on Railway. Redeploy.
2. In AngelOS, open the thread from step 6, draft or write a reply, approve/send it.
3. Confirm the reply actually arrives on the real Instagram/Facebook thread (check from the other account).
4. Check `message_send_attempts` in Supabase — should show exactly one row, `status = sent`.

If you want to stop here and not go further today, just don't do step 7 — steps 0-6 are receive-only and safe to leave running.

## 8. If something's wrong

Send me:
- The exact Railway log lines around the failed attempt.
- Which step you were on.

I can read logs and fix code from there — I just can't do the Meta dashboard or Supabase data-entry steps for you.

---

## 9. LINE outbound — human setup (do this only when ready to test real LINE sends)

**Status: FULLY BUILT AND VERIFIED (transport OFF).** The LINE outbound code path is complete and tested locally. No real LINE messages can be sent until you complete this section.

**What's verified locally (no real LINE needed):**
- `scripts/line-adapter.test.mjs` — 13/13 unit tests (adapter class, mocked fetch): credential auth, send-once idempotency, missing credential fails closed, transport disabled blocks send, status endpoint hides secrets, adapter-level validation
- `scripts/line-test.mjs` — 3/3 harness tests + 1/1 skip: transport disabled → 409 (adapter not resolved), transport enabled + unreachable LINE API → 500 with DB lifecycle closed (message failed, send attempt recorded as unknown with error_message + finished_at via `sendMessage` at messaging.service.ts:623), duplicate send blocked when prior attempt is unknown
- `npm run build:api` — PASS
- `npm run verify:static` — PASS (5/5 checks)
- `npm run test:synthetic` — PASS (Flow 1 + core safety + Hermes control layer integration — 82/82 tests + 1 skip, all green)
- `npm run typecheck` — PASS

**What the harness tests prove:** The honest DB lifecycle and the transport gate. The harness blocks external network, so these tests do NOT cover the happy LINE API path (LINE API returns 200 → adapter.send returns `{sent:true}`). That path is covered by the adapter unit tests (13/13) and by the adapter's implementation.

**Migration note:** `supabase/migrations/20260907052000_oauth_connections_table.sql` creates `oauth_connections` and `integration_apps` tables for the local/harness DB. It uses `create table if not exists`, `alter table ... enable row level security` (idempotent), and role-gated GRANT/REVOKE inside `DO $$ IF EXISTS` blocks. It is SAFE and IDEMPOTENT against the live Supabase project — but the live Supabase already has these tables (created out of band, same pattern as the original approvals tables before `20260905181853_approvals_schema.sql`). Running this migration against live is safe but unnecessary. Do NOT apply it unless you first verify the live schema matches.

### 9a. Get a LINE channel access token

1. Go to [LINE Developers Console](https://developers.line.biz/) → your provider → **Messaging API** channel.
2. Under **Channel access token**, issue a new token. Note its expiry.
3. Copy the **Channel secret** from Channel settings.

### 9b. Store credentials in Supabase (dashboard, not chat)

**Table `oauth_connections`** — one row:
| column | value |
|---|---|
| `workspace_id` | your workspace UUID |
| `provider` | `line` |
| `access_token` | the channel access token from 9a |
| `access_expires_at` | its expiry timestamp |
| `status` | `active` |
| `open_id` | the LINE user ID you want to send to (or leave for now) |

**Table `integration_apps`** — one row:
| column | value |
|---|---|
| `workspace_id` | your workspace UUID |
| `provider` | `line` |
| `client_key` | the channel access token (or channel ID — whichever your setup uses as the identifier) |
| `client_secret` | the channel secret from 9a |

**Table `messaging_channels`** — one row:
| column | value |
|---|---|
| `workspace_id` | your workspace UUID |
| `provider` | `line` |
| `display_name` | e.g. "LINE Official Account" |
| `external_account_id` | the LINE user ID / destination ID |
| `status` | `connected` |
| `capabilities` | `{"inbound": true, "outbound": true}` |

### 9c. Set Railway environment variables (what turns on real sending)

On the `@angelos/api` service in Railway:
- `LINE_TRANSPORT_ENABLED=true`
- `LINE_STAGING_WORKSPACE_ID=<your workspace UUID>`

**Leave these unset** until you're ready to send real messages. Without them, `lineTransportEnabled()` returns false and every LINE send path safely stops with a 409 ConflictException.

### 9d. Inbound LINE (separate from outbound)

LINE inbound messages arrive via webhook. Two options:
- **n8n webhook** → AngelOS inbound endpoint (existing pattern — same as Meta webhook).
- **Direct LINE webhook** → a dedicated webhook endpoint in AngelOS (not built yet — ask if you want this).

The outbound path tested here is independent of inbound — you can send LINE replies once credentials are in place, even before inbound is set up.

### 9e. Test outbound (this is the one that sends a real LINE message — do this deliberately)

Only after credentials are stored:
1. Confirm `LINE_TRANSPORT_ENABLED=true` and `LINE_STAGING_WORKSPACE_ID` are set on Railway. Redeploy.
2. In AngelOS, open a LINE thread, draft or write a reply, approve/send it.
3. Confirm the reply arrives on the real LINE thread.
4. Check `message_send_attempts` in Supabase — should show exactly one row, `status = sent`.

### 9f. The real LINE path (once credentials exist)

inbound webhook/n8n → staged draft → owner review → explicit send release → LINE adapter → `message_send_attempts`/result

The outbound path: owner drafts/writes reply → `approveAndSend` → `sendMessage` → `resolveAdapter('line')` → `LineMessagingAdapter.send()` → `message_send_attempts` (idempotency key `message:{messageId}` + status + `finished_at`) → message marked `sent`/`failed`, thread updated.

The code is ready. The transport is OFF. Nothing sends until you set the env vars.

## 10. Hermes / Planner control layer — human setup

**Status: CODE COMPLETE. LIVE TEST PENDING.** The Hermes/Planner control layer is fully built and the backend compiles/tests green. No live deployment has occurred.

**What's built (code-side, ready):**
- `apps/api/src/hermes/hermes-task.service.ts` — Hermes task store: `create()`, `getOne()`, `listRecent()`, `updateStatus()` (approve, record result). Idempotent on `(workspace_id, source_ref)`. RLS: workspace members read/write; service_role full access for n8n callback. Uses `workspace_memberships` table to resolve workspace (reuses existing AngelOS pattern).
- `apps/api/src/hermes/hermes-control.service.ts` — Unified overview: `GET /workspaces/:ws/hermes/overview` surfaces pending approvals + attention items + system health in ONE place.
- `apps/api/src/hermes/hermes-control.controller.ts` — Endpoints: `POST /hermes/tasks` (create), `GET /hermes/tasks` (list), `GET /hermes/tasks/:id` (get), `POST /hermes/tasks/:id/approve`, `POST /hermes/tasks/:id/result`. All behind `SupabaseAuthGuard`.
- `apps/api/src/hermes/n8n-callback.controller.ts` — `POST /hermes/n8n/callback` — records Hermes Builder result in Supabase + fires Telegram callback if stored.
- `apps/api/src/hermes/hermes-builder-executor.service.ts` — `execute()` — Hermes Builder execution engine. Demo-mode: simulates build/fix/review/status tasks with realistic output. In production, hooks into real OpenAI + code execution.
- `apps/api/src/hermes/hermes-builder-result-recorder.service.ts` — `recordResult()` — standalone result recorder for n8n callback. Safe JSON serialization for Supabase storage.
- `n8n/angelos-planner-bot-workflow.json` — Updated n8n workflow: AngelOS API calls (create task, get status), Hermes Builder execution branch, results → Telegram. 24 nodes, 13 connection groups.
- `n8n/angelos-intent-router.js` — Intent classification: status/blockers/next/build/fix/review/plan/chat. Maps to n8n workflow branches.

**What Angel must personally do:**
1. **Supabase migration** — Apply `supabase/migrations/20260908000000_hermes_tasks_table.sql` to your Supabase project. Go to Supabase Dashboard → SQL Editor → paste the migration → Run. The migration creates the `hermes_tasks` table with RLS (workspace members can read/write; service_role full access for n8n). It is idempotent (`create table if not exists`).
2. **Railway deployment** — The Hermes/Planner endpoints need to be deployed to your `@angelos/api` Railway service. Either point Railway at the `integration/angelos-core` branch, or merge to `main`. Nothing works until the API on `angelosapi-production.up.railway.app` contains this code.
3. **n8n workflow import** — In your n8n instance: Workflows → Import from File → select `n8n/angelos-planner-bot-workflow.json`. The workflow calls AngelOS API endpoints (`POST /hermes/tasks`, `GET /hermes/overview`). These need the API to be deployed first.
4. **n8n credential** — The workflow references `AngelOS-Planner-Telegram-Bot` (Telegram) and OpenAI credential. Create/reuse these in n8n credentials.
5. **Environment variables** — The n8n workflow needs `ANGELOS_API_URL` set to your deployed API URL (default `https://angelosapi-production.up.railway.app`). Set this in your n8n environment or as a workflow parameter.
6. **Telegram bot** — Create via @BotFather on Telegram. Get the bot token. **Do NOT paste the token in chat.** Store it in n8n Telegram Bot API credential.
7. **Angel Telegram user ID** — Find via @userinfobot on Telegram (e.g., `123456789`). Store as n8n text credential `AngelOS-Planner-Angel-UserId` (must match workflow).

**What the control layer does NOT do:** does NOT deploy, publish, or send real messages; does NOT touch real clients or the old live LINE workflow; does NOT expose any tokens or credentials; does NOT require manual Supabase row editing after migration applied (all rows are created by the API).

**Current blocker for live testing:** API not deployed to Railway + n8n not running + Supabase migration not applied. Code is complete and tested. Once deployed, you can test: `/status` in Telegram → AngelOS overview API → status reply in Telegram. `/build X` → create task → Hermes Builder execute → result → Telegram.

**If something's wrong:** send the exact error (from n8n, Railway logs, or Telegram), which step you were on. I can fix the code from logs — I just can't do the Meta/NLINE/n8n/BotFather/Railway dashboard steps for you.

---

## 11. Telegram Planner Bot — Human Setup (temporary bridge, not AngelOS)

This bot is a TEMPORARY remote-control channel so Angel can talk to Hermes while away from the laptop. Telegram is NOT AngelOS, NOT the final UI, NOT the approval center.

**What's built (code-side, ready):**
- `n8n/angelos-planner-bot-workflow.json` — Updated portable n8n workflow (24 nodes): Telegram trigger → Angel-only guard → command router → OpenAI + canned replies AND AngelOS API calls (create task, get status) AND Hermes Builder execution branch → Telegram reply. Valid JSON, validated.
- `n8n/angelos-planner-system-instructions.md` — Full OpenAI system instructions for the Planner Agent.
- `n8n/angelos-planner-bot-worker.js` — n8n Code node worker (Angel-only enforcement, command dispatch, intent classification). Valid JS, syntax-checked.
- `n8n/angelos-intent-router.js` — Intent classification module (status/blockers/next/build/fix/review/plan/chat). Valid JS.

**Commands:** /status, /help, /blockers (canned replies — no OpenAI needed). /next, /continue, /report, /plan, /chat (OpenAI chat node — uses system instructions + Angel's message). Build/fix/review intents → AngelOS API task creation + Hermes Builder execution → result back to Telegram.

**What Angel must personally do:**
1. **Start n8n** — `npx --yes n8n start --host 127.0.0.1 --port 5678` (or your normal n8n setup). Confirm it's running: `curl http://127.0.0.1:5678/api/status`.
2. **BotFather** — create the Telegram bot: open Telegram → @BotFather → `/newbot` → name it (e.g. "AngelOS Planner") → copy the bot token. **Do NOT paste the token in chat.** Store it in n8n.
3. **n8n credentials** — create:
   - Telegram Bot API credential (paste BotFather token). Name: `AngelOS-Planner-Telegram-Bot` (must match workflow JSON: `AngelOS-Planner-Telegram-Bot`).
   - OpenAI API credential (reuse existing OpenAI credential if available). Name: `AngelOS-OpenAI` (must match: `AngelOS-OpenAI`).
   - Text credential: `AngelOS-Planner-Angel-UserId` — your Telegram numeric user ID (find via @userinfobot on Telegram, e.g. `123456789`).
4. **Import the updated workflow** — n8n: Workflows → Import from File → select `n8n/angelos-planner-bot-workflow.json`. Connect the credentials. The workflow now calls AngelOS API endpoints — these need the API deployed first.
5. **Activate** — toggle the workflow Active. The Telegram Trigger starts listening.
6. **Test (safe):** `/help` → help message. `/status` → canned status (or AngelOS overview if API deployed). `/blockers` → canned blockers. Any non-command → OpenAI chat. `/next` → canned "need state first". Anyone else → "This bot is for Angel only." `/build X` → creates task in AngelOS (if API deployed) → Hermes Builder executes → result in Telegram.

**What the bot does NOT do:** does NOT deploy, publish, or send real messages; does NOT touch real clients or the old live LINE workflow; does NOT build a second AngelOS; does NOT read live n8n/Supabase state (unless you paste it); does NOT expose Telegram bot token or OpenAI credentials.

**Current blocker:** n8n is not reachable from this machine during the build — the workflow JSON, system instructions, worker, intent router, and setup doc are all built and ready. Once n8n is running and reachable, Angel imports the updated workflow, connects credentials, and the bot is live in Telegram.

**If something's wrong:** send the exact n8n workflow error (if any), the Telegram error (if any), and whether n8n is running/reachable. I can fix the workflow from the logs — I just can't do BotFather or n8n credential steps for you.

