# Flow 1 integration — 2026-09-06

Status: **BUILT, CONNECTED and TESTED locally; at-most-once dispatch PROVEN for the isolated synthetic flow.**
Hosted staging, real Supabase Auth/PostgREST/Realtime, phone acceptance and live providers are not proven by this run.

## Existing code reused

The six local commits ending at `4c5e262` were inspected and preserved. Existing
Approvals routes/screen, MessagingService, ManualDemoMessagingAdapter, client/thread/channel
identities, operational controls, approvals/history and message/send-attempt tables are reused.
The uncommitted `feat/approvals-core` checkout was preserved. No booking, CRM, health,
emergency-control or cost module was rebuilt. No new messaging framework was introduced.

The missing approvals schema was reused from local commit `6c1d539` under a CLI-generated
migration filename. Its previous broad write policies are restricted by the Flow 1 migration.

## Changes

- A staging bridge connects approval decisions to the existing safe manual adapter.
  Message approvals cannot fall back to the legacy n8n execution webhook.
- Draft and approval creation is one PostgreSQL transaction keyed to the inbound message.
  Repeated/concurrent draft generation returns the same draft/approval, or rejects a changed
  draft. It cannot create multiple independently sendable replies to the same inbound message.
- Approval decision and history are committed together. Repeated identical decisions are
  idempotent; conflicting decisions are rejected.
- A database claim locks and validates the approved message, client, thread, channel and
  verified channel identity, then inserts the canonical `message:<message-id>` send attempt.
  Only the transaction that inserted that attempt may call the adapter.
- Claim and message state become `unknown` before the adapter is called. Adapter exceptions,
  process loss and recorder failures cannot cause another worker to send again.
- Delivery attempt, message state, provider ID and successful thread update are recorded
  transactionally. `sent`, `failed` and `unknown` remain distinct.
- `POST /approvals/:id/execute` resumes only unclaimed, approved staging work. Claimed work
  returns its recorded state without calling an adapter. Direct synthetic send bypass is blocked.
- The existing approvals screen distinguishes recorded synthetic delivery from delivery needing review.
- New RPCs use SECURITY INVOKER, service-role-only execution privileges and explicit owner
  checks. Authenticated callers cannot write approvals/history or invoke execution RPCs.

## Staging-only gates

All must match; defaults do not activate execution:

1. `NODE_ENV=staging`.
2. `FLOW1_STAGING_EXECUTION_ENABLED=true`.
3. `FLOW1_STAGING_WORKSPACE_ID` equals the requested workspace.
4. That workspace has `workspace_operational_controls.flow1_staging_enabled=true`.
5. Its channel is connected, provider `manual`, and capabilities include `flow1_test: true`.
6. Its external thread ID begins with `synthetic:` and its client/channel identity is verified.
7. The caller owns the workspace and emergency read-only/automation pause is off.

The migrations do not enable any workspace. The tests enable only their disposable synthetic
workspace. No hosted database, live LINE, Meta publishing, real client, n8n webhook or AI service
was contacted. No deployment, push or merge was performed.

## Reproduce locally

From this worktree, with the existing application dependencies installed:

```powershell
npm run test:flow1:setup
npm run typecheck
npm run verify:static
npm run test:synthetic
```

The test-only dependencies are pinned in `scripts/flow1-tests/package-lock.json` and kept
separate from application dependencies. The harness creates a unique temporary PostgreSQL
cluster on a randomly selected loopback port, starts the actual Nest routes, and stops/removes
only that test cluster afterward. The Windows sandbox cannot create PostgreSQL's restricted
startup token; this run used an approved unsandboxed test process with non-loopback traffic blocked.
Windows x64 is the verified platform for this harness.

The application uses a test Supabase query/RPC facade backed by real PostgreSQL connections.
The foundation, CRM, messaging, operational-control and two new migrations run in PostgreSQL,
with authenticated/service roles and real RLS. Supabase authentication and AI draft generation
are synthetic fixtures. The adapter is the
existing ManualDemoMessagingAdapter, instrumented to count calls. This is not a hosted
Supabase Auth/PostgREST/Realtime acceptance test and does not render the mobile screen.

## Results

- API and mobile typecheck: passed.
- API build: passed.
- Static, migration sequence (15 files), staging contract, secret scan and deployment-pack checks: passed.
- Existing synthetic regressions: **29 passed, 0 failed**.
- PostgreSQL + Nest Flow 1 E2E/concurrency tests: **20 passed, 0 failed**.
- `git diff --check`: passed.

The new suite verifies inbound persistence, draft creation, pending approval visibility,
approval, exact approved/revised body and routing, recorded delivery, duplicate approval
and draft requests, 24 concurrent approval requests, 24 concurrent execution requests,
eight separate worker processes, rejection, conflicting revisions, unknown/failed outcomes,
loss of the worker before sending, failure after sending, atomic rollback of history/result
writes, RLS/privileges, owner/tenant checks, emergency controls, production/disabled flags,
live LINE rejection and direct-send bypass prevention.

**Multi-process evidence:** eight independent Node worker processes raced one approval;
exactly one inserted a claim and made a provider call. The test provider-call table has no
uniqueness constraint, so it would retain duplicate calls rather than conceal them.

Initial failures were test setup issues: Windows sandbox PostgreSQL startup, a duplicate Nest
runtime in the harness, and a missing nested-relation projection in the test facade. All were
corrected before the final passing runs. No failing product test remains.

## Meaning of the proof and next action

The guarantee is **one durable claim and at most one adapter invocation per outbound message**.
It is not a promise of eventual delivery across crashes: a worker lost after claiming can leave
zero sends, and a worker lost after sending can leave unknown delivery. Such claims are never
expired, deleted or replayed automatically. Reconciliation requires trusted provider evidence;
the finish RPC can record it without executing another send. No automatic retry of failed or
unknown delivery was introduced.

No blocker remains for this local synthetic Flow 1 integration. Before calling hosted staging
PROVEN, designate a disposable Supabase staging project, review/apply the two new migrations
there, opt in only its synthetic workspace/manual channel, and repeat the route sequence with
real staging Auth/PostgREST and approval-screen observation. Verify the approvals table's
Realtime publication if testing live queue updates. Keep all live-provider and production
connections disabled. No hosted project was selected or altered in this task.

The other database-level booking/CRM items in `CORE_SAFETY_VERIFICATION.md` are outside this
Flow 1 request and remain separate work; this report supersedes its outbound approval-bridge gap.
