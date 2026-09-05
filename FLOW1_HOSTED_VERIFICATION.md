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

## Authenticated continuation
The user explicitly authorized storing only the disposable project's server key in ignored local staging configuration. The key was transferred without displaying/logging its value, the browser clipboard was cleared, and the loopback intake server was stopped. A first empty clipboard transfer was detected by runtime validation and corrected; real Auth then passed.

Passed:
- Real Supabase Auth synthetic owner creation, password sign-in and getUser.
- Authenticated PostgREST workspace RLS read.
- Actual Nest AppModule runtime against disposable Supabase; unauthenticated approvals rejected with 401; authenticated workspace API passed.
- Inbound ingest API created the synthetic thread/message; approval creation and pending-list API passed.
- Authenticated Realtime subscription and matching approvals INSERT event reception passed.
- API readiness returned 200 against hosted database.
- iPhone Expo manifest and bundle returned 200; bundle contains disposable Supabase URL and excludes existing project URL.

One approval is pending for actual phone acceptance: 577a923c-7dce-42d3-abf2-fd03f913a028. Zero sends have occurred. Duplicate/retry verification is prepared but deliberately waits for this approval to be approved on the phone. Authenticated delivery recording and exactly-one provider invocation are not yet proven in hosted staging.

Temporary local test sessions: API port 3001, isolated Metro port 8083. Metro reuses the existing installed dependencies through an ignored worktree junction; no package updates. Existing port 8082 was left untouched. API fetch is restricted to the disposable project host; live-provider/automation credentials are removed from its environment. AI endpoints were not invoked.

Automatic review rejected creation of a new local-subnet inbound firewall rule; no firewall change was made. Local LAN-address probes passed, but actual phone reachability still needs user verification. The phone instructions and test-user credentials are in ignored .flow1-hosted/PHONE_TEST.txt (no service key there).

Status remains NOT PROVEN, awaiting actual phone approval, followed by 24 duplicate approval/execution requests and verification of one provider call, one attempt/history row and correct delivery evidence. No real provider connection is authorized.
