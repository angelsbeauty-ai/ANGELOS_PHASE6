# AngelOS Build Status

Generated: 2026-09-06. Branch: `integration/angelos-core`, commit `3f46e5e`, pushed.

## Where everything lives

- **Canonical branch right now: `integration/angelos-core`** (not `main`, not `feat/approvals-core`, not `chatgpt/angelos-core`). It merges the approvals/bookings/safety hardening work with Codex's Flow 1 messaging work, with conflicts resolved and verified.
- `feat/approvals-core` and `chatgpt/angelos-core` still exist, untouched, in case anything needs to be cross-checked.
- `.worktrees/angelos-core` (checked out on `chatgpt/angelos-core`) is now 3 commits behind `integration/angelos-core`. If you or Codex keep working there, that work will diverge again.
- No PR into `main` has been opened. Nothing has been merged to `main`.

## Area status

| Area | Status |
|---|---|
| Approvals | BUILT / CONNECTED / INTERNALLY PROVEN |
| Bookings | BUILT / CONNECTED / INTERNALLY PROVEN |
| Messaging core (channels, threads, drafts, translate) | BUILT / CONNECTED / INTERNALLY PROVEN |
| LINE Client Control staging | BUILT / CONNECTED — **NEEDS FINAL TEST** (see gap below) |
| Flow 1 (LINE approval → guarded send) | BUILT / CONNECTED / INTERNALLY PROVEN in the **disposable** Supabase project only. Real project: code present, deliberately dormant, NOT applied to schema. |
| Meta transport (Instagram/Facebook direct send) | BUILT / CONNECTED — **NEEDS FINAL TEST**, dormant by default |
| Meta inbound webhook | BUILT — **NEEDS FINAL TEST** (needs a real Meta app registered against it) |
| Safety guards (emergency stop, subscription, feature flags, beta) | BUILT / CONNECTED / INTERNALLY PROVEN |
| Clients/CRM, Analytics, System Health, Owner Actions, Costs/Usage | Audited earlier this session; several confirmed findings **not yet fixed** (see "Known gaps" below) |
| Content Control | Not started. Per your instruction, deliberately left alone. |

"Internally proven" = passed automated tests I ran (unit tests, an embedded-Postgres end-to-end suite, or a synthetic smoke test) — not tapped on your phone. Everything marked "needs final test" needs that from you.

## What actually works right now, if you do nothing else

Nothing new sends to a real client. Two independent kill switches both have to be off, and both are off everywhere except a disposable test project:

1. **Flow 1** (LINE approval-gated send): requires `FLOW1_STAGING_EXECUTION_ENABLED=true` + `FLOW1_STAGING_WORKSPACE_ID=<one workspace>`. Not set on Railway or locally.
2. **Meta transport** (direct Instagram/Facebook send): requires `META_TRANSPORT_ENABLED=true`. Not set anywhere.

## Known gaps (found by audit, not yet fixed this session)

- **LINE Client Control**: the review queue and screens exist, but nothing in the repo calls `save_client_control_draft` — no draft is ever staged, so the queue stays empty. Someone (n8n, most likely) needs to call it.
- Clients/CRM: payment idempotency key fixed; a `PATCH` client route and the consents route have no mobile caller yet, including the only path that sets `do_not_auto_message`.
- Owner Actions: `revokeTester` can force-downgrade a paying workspace's subscription with no status guard and no audit row. Not fixed yet.
- System Health: the AI health check can report "healthy" while `AI_PROVIDER_MODE` is actually `mock`.
- Analytics/System Health: a couple of low-severity mobile-unreachable routes and a swallowed error on one audit write.

None of these are new — they were found during the earlier full-core audit and intentionally deferred so this session could focus on Meta.

## What I did NOT do (stopped here on purpose)

- Did not fix the Clients/CRM, Owner Actions, System Health gaps above.
- Did not build a real OAuth connect flow for Instagram/Facebook (see SELF_TEST.md — for now you'll paste tokens by hand).
- Did not register anything with Meta's dashboard — that requires your login.
- Did not touch `main`, did not open a PR.
- Did not re-run the slow embedded-Postgres Flow 1 suite after the Meta commit (only after the merge-fix commit) — nothing in the Meta commit touches Flow 1 code, so this is low-risk, but it's unverified by me specifically for that commit.

Continue with `git checkout integration/angelos-core` from here — everything above is committed and pushed.
