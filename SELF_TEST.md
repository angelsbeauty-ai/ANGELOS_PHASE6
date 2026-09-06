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
