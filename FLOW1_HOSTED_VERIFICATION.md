# Hosted Flow 1 staging verification

Status: NOT PROVEN. Database setup verified; authenticated runtime and phone acceptance blocked on local staging credential access.

## Disposable project
- Project: angelos-flow1-disposable (rdohphbzljywywjmktes), Tokyo.
- Supabase quoted project cost: $0/month; created under the user's free-only authorization.
- Existing project hhzegavoyuicclsmrkwf was not queried or modified in this continuation.
- Workspace: 95ee6a0d-d029-4233-9218-ec79f7fe99c1.
- Manual synthetic channel: f466dfc3-9249-4cdf-a2d0-35905a1bd0cf.

## Applied and verified
- Reused base migrations 0001-0012 and 0013 hardening, plus both Flow 1 migrations.
- Fresh project exposed an existing 0013 assumption: public.rls_auto_enable() need not exist. Its privilege revocation is now conditional. The corrected migration passed against hosted staging.
- Both approvals_schema and staging_flow1_execution applied successfully.
- Staging-only publication migration flow1_staging_realtime adds public.approvals to supabase_realtime (hosted setup, not an execution switch).
- Exactly one workspace opted in; exactly one connected manual channel with flow1_test=true.
- Zero other provider channels, zero clients, zero send attempts.
- All Flow 1 RPCs deny EXECUTE to anon and authenticated.
- No runtime launched, owner user created, real messages sent, production deployment, push or merge.

## Checks
- API/mobile typecheck passed.
- Static, migration sequence, staging contract, secret scan and deployment-pack checks passed.
- git diff --check passed.
- Hosted Auth login, authenticated PostgREST/RLS, Realtime event reception, concurrency and phone approval E2E are NOT tested yet.
- Initial migration failure (missing helper) corrected. One intermediate tool SQL rendering attempt also failed; corrected file applied successfully.

## Blocker and next action
The Supabase connector exposes publishable keys but no server key retrieval. The CLI has no management access token. An authenticated dashboard is available for the disposable project. Automatic approval review rejected copying its existing server key through a loopback-only local setup form and storing it in the ignored .flow1-hosted directory because that specific credential transfer was not explicitly authorized. No server key was persisted. The local intake server was stopped and the browser clipboard cleared.

Next: obtain explicit authorization for that staging-only credential transfer, or have the user securely configure the local staging server credential themselves (never paste it in chat). Then create a synthetic Auth owner, start only the staging API/mobile session, verify real Auth/PostgREST/Realtime, and perform the phone approval and duplicate/retry tests. Database opt-in alone cannot execute without the staging runtime environment and owner membership.
