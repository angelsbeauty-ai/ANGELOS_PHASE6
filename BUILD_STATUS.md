# AngelOS Build Status

Generated: 2026-09-06. Branch: `integration/angelos-core`, commit `448edd0`, pushed.

## Railway: consolidation state

**Canonical project: `abundant-forgiveness` → service `@angelos/api` → `angelosapi-production.up.railway.app`.**

Evidence-based finding: *neither* Railway project was production. Both run `NODE_ENV=staging` against the **same** Supabase project (`hhzegavoyuicclsmrkwf`). The "production" in the canonical domain is Railway's auto-generated naming, nothing more.

Migrated from `blissful-courtesy` → canonical (values piped stdin-to-stdin, never printed or written to disk):

| Var | Why |
|---|---|
| `FOUNDER_USER_IDS` | closed a real gap — `beta.service.ts`, `beta-access.guard.ts`, `founder.guard.ts` all read it; canonical had none |
| `FOUNDER_EMAIL` | `bootstrap-founder.mjs`, `verify-staging-founder.mjs` |
| `STAGING_TEST_EMAIL_A/B`, `STAGING_TEST_PASSWORD_A/B` | `staging-smoke.mjs` |
| `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_PUBLISHABLE_KEY` | `staging-smoke.mjs` |
| `STAGING_API_URL` | set to the canonical domain (not copied from blissful-courtesy's) |

Deliberately **not** migrated: `SUPABASE_ANON_KEY` (canonical has the modern `SUPABASE_PUBLISHABLE_KEY`), and `USE_LOCAL_OAUTH` / `USE_STAGING_OAUTH` / `AI_AGENT` / `API_TIMEOUT_MS` — grep shows nothing in this repo consumes them.

**Parity proven:** canonical passes `npm run test:staging` 6/6 (the suite `blissful-courtesy` was built to run), 15/15 required vars present, `health/ready` HTTP 200.

### ⛔ Waiting on your approval — retirement of `blissful-courtesy`

Everything required has been migrated and verified. The retirement itself is irreversible, so it stops here as instructed. **Nothing has been deleted, repointed, or redeployed.**

### Still open: staging vs production is not real yet

Both Railway projects point at one Supabase database, so splitting Railway environments alone is cosmetic — a staging test can write real client data today. Real separation needs a **second Supabase project** for production. That costs money and is production-impacting, so it is not started.

## Area status

| Area | Status |
|---|---|
| Approvals | BUILT / CONNECTED / INTERNALLY PROVEN |
| Bookings (incl. owner journey: confirm/cancel/complete) | BUILT / CONNECTED / INTERNALLY PROVEN |
| Messaging core | BUILT / CONNECTED / INTERNALLY PROVEN |
| LINE Client Control | BUILT / CONNECTED / INTERNALLY PROVEN — writer connected, queue no longer dead |
|| LINE outbound adapter (this session) | **CODE READY / TRANSPORT OFF / HUMAN SETUP LATER** — full build verified: `LineMessagingAdapter` built, `resolveAdapter('line')` wired behind `lineTransportEnabled()` gate (off by default), safe credential loading from `oauth_connections`/`integration_apps`/`messaging_channels`, send-once idempotency via `message_send_attempts`, result recording with `finished_at`; unit tests 13/13, harness integration tests 3/3 + 1/1 skip; no live send, no production activation, no changes to old live LINE workflow; migration `20260907052000_oauth_connections_table.sql` is safe+idempotent, for local/harness DB only (live Supabase already has the tables out of band) |
|| Hermes/Planner control layer (this session) | **BUILT / NOT DEPLOYED** — unified `/workspaces/:ws/hermes/overview` surfaces pending approvals + attention items + system health in one place; `/workspaces/:ws/hermes/decide` routes approval decisions; full Hermes task lifecycle (`POST /hermes/tasks`, `GET /hermes/tasks`, `GET /hermes/tasks/:id`, `POST /hermes/tasks/:id/approve`, `POST /hermes/tasks/:id/result`); n8n callback endpoint (`POST /hermes/n8n/callback`); Hermes Builder executor service with demo-mode execution + Supabase result recording; n8n orchestration workflow JSON updated with AngelOS API calls. Build green, 82/82 tests + 1 skip. CODE COMPLETE. LIVE TEST PENDING n8n deployment + credential config. |
| Flow 1 (LINE approval → guarded send) | INTERNALLY PROVEN in the disposable project only; dormant + unapplied on real |
| Meta transport (Instagram/Facebook send) | BUILT / INTERNALLY PROVEN — **dormant**, NEEDS FINAL TEST |
| Meta inbound webhook | BUILT — NEEDS FINAL TEST (needs your Meta app registered) |
| Safety guards | BUILT / CONNECTED / INTERNALLY PROVEN |
| Owner Actions / Costs | Beta-revocation downgrade bug fixed + audited |
| System Health | Mock-AI misreport fixed |
| Clients/CRM | Payment double-charge fixed; `PATCH` client + consents routes still have no mobile caller |
| Content Control | Not started (deliberately) |

## This session's commits

- `1d798c0` Meta setup diagnostics + credential-lookup hardening
- `167fc51` Client Control draft writer (closed the empty-queue blocker)
- `117ea74` Beta revocation no longer downgrades paying workspaces; mock AI no longer "healthy"
- `448edd0` Booking owner journey (cancel/complete on calendar)

Test baseline: **core-safety 40/40**, staging smoke 6/6, `verify:static` (5 checks), API build, mobile typecheck — all green.

## Nothing can message a real client

Two independent gates, both off everywhere except the disposable test project:
1. **Flow 1**: needs `FLOW1_STAGING_EXECUTION_ENABLED=true` + `FLOW1_STAGING_WORKSPACE_ID`.
2. **Meta**: needs `META_TRANSPORT_ENABLED=true`.

No webhook is registered with Meta. `N8N_WEBHOOK_APPROVAL_EXECUTE` is unset, so approving an approval dispatches nothing.

## Continuation point

1. **Blocked on you:** approve `blissful-courtesy` retirement; do the Meta App setup in SELF_TEST.md.
2. Hermes/Planner control layer — **BUILT** this session: unified `/workspaces/:workspaceId/hermes/overview` and `/workspaces/:workspaceId/hermes/decide` endpoints surfaced all pending approvals + attention items + system health in one place
3. Then: Instagram inbound E2E → Facebook reuse (same adapter, `provider='facebook'`) → production activation approval.
4. Unblocked backlog: Clients/CRM unreachable routes (`PATCH` client, consents — the only path that sets `do_not_auto_message`), Content Control.
