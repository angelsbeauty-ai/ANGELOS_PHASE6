# AngelOS core safety verification — 2026-09-06

Branch: `chatgpt/angelos-core`, continued from `d67aa84` in `.worktrees/angelos-core`.
The original `feat/approvals-core` checkout and its pre-existing changes were preserved.
All changes and commits are local. No deployment, push, merge, live LINE, Meta publishing,
or real client delivery was performed. No database migration was applied.

## Changed

- Messaging (`0e1f771`): one persisted send claim per message; uncertain attempts cannot
  be replayed automatically; disconnected/live transports stop; duplicate inbound IDs
  are checked before writes; client/channel identity mismatches are rejected; backend
  message writes explicitly filter by workspace.
- Bookings and automations (`b2791ef`): allowed lifecycle transitions; unchanged retries
  are no-ops; concurrent updates compare saved status/time/version; optional persisted
  create-request keys reuse the existing appointment primary key. Mobile retains a key
  for unchanged form retries and prevents simultaneous save calls. Availability includes
  asymmetric buffers. Workers claim pending jobs once and recheck pause controls per job.
- CRM (`af6d2c5`): checks both supplied contact fields on create and update; rejects blank
  display names; does not merge clients by display name.
- Health and controls (`1831300`): lookup failures stop business mutations; query strings
  cannot bypass emergency checks; recovery requires owner membership; unknown health is
  not reported as healthy; an unimplemented live transport is not reported as ready.
- Owner analytics (`c241b4d`): owner access check, finite date windows, saved subscription
  quote including discount/interval, and explicit unknown actual provider costs. No
  estimated or invented provider charges are presented as measured costs.
- Added `npm run test:synthetic`, using the built API with an in-memory query double.
  Network access through fetch and socket connections is explicitly disabled in the suite.

## Tests passed

- `npm run check`: static verification, migration sequence (13 existing migrations),
  staging contract, secret scan, deployment-pack checks, API/mobile typecheck, API build.
- `node --test scripts/core-safety.test.cjs`: 29 passed, 0 failed.
- `git diff --check`: passed.

Tests cover duplicate/concurrent delivery claims; live-provider rejection; identity and
tenant boundaries; booking terminal states, creation retries, changed request payloads,
concurrent transitions, reschedule retries, and asymmetric buffers; concurrent workers;
CRM duplicate contact checks; unavailable emergency controls; recovery access; owner
authorization; unknown health; cost quote arithmetic; and the network prohibition.

## Tests failed

None in the final run. During setup, mobile typecheck used the ancestor's TypeScript 5
instead of the mobile package's installed TypeScript 6. The isolated worktree now uses
a local junction to the existing mobile dependencies; no compiler configuration or
dependency versions were changed. An initial syntax error in the new test harness was
corrected before the passing runs.

## Blockers and remaining work

This is a verified application-layer hardening pass, not full database-level certification.
No `docker`, `psql`, or `supabase` executable was available on PATH. The synthetic query
double does not verify Postgres RLS, exclusion constraints, transaction rollback, or
real PostgREST behavior. No phone UI acceptance test was performed.

The following existing gaps still require work before the five areas can be called fully finished:

1. Inbound ingest performs client, thread, message, and identity writes separately.
   Concurrent first messages or partial failures can leave incomplete records; move this
   operation into a tested database transaction before enabling a live provider.
2. Booking mutations and their history/automation writes are separate transactions.
   A failure after the appointment update can leave missing history or job planning.
   Verify transactional recovery and the existing overlap constraint in an isolated database.
3. CRM contact duplicate checks are application-level checks, not concurrent uniqueness
   guarantees. Establish the intended shared-contact policy and test database enforcement
   against synthetic existing duplicates before adding a constraint.
4. Ambiguous message attempts are deliberately blocked, but owner reconciliation of
   delivery evidence is not yet a complete workflow.
5. Actual AI, messaging, and hosting costs remain unmeasured. The owner view shows only
   the saved subscription quote and unknown actual costs.

## Next action

Use an isolated local PostgreSQL/Supabase test database with synthetic tenants to finish
transactional ingest, booking history/job recovery, and CRM concurrency tests. Keep live
transports disabled and production untouched. Then verify the mobile screens on a test device.
