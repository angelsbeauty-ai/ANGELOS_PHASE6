# AngelOS Live Staging Status

## Environment mapping

- **Staging Supabase project:** `hhzegavoyuicclsmrkwf`
- **Staging URL:** `https://hhzegavoyuicclsmrkwf.supabase.co`
- **Production target:** the separate Supabase project named **Angel OS** remains untouched.

No private service-role key is stored in this repository.

## Live database status

- AngelOS schema from V1 migrations `0001` through `0012` is live in staging.
- Advisor-driven hardening in `0013_staging_security_hardening.sql` mirrors the live staging fixes.
- 53 public application tables are present.
- 0 public application tables have RLS disabled.
- `platform_release_state` is `invite_only_beta` with `public_signup_enabled = false`.
- `angelos-media` storage bucket is private.
- Solo plan configuration is $49/month, $490/year, 14-day public trial.

## Security advisor status

Resolved during live staging setup:

- anonymous/direct RPC access to trigger-only `SECURITY DEFINER` helpers
- anonymous access to workspace creation
- `btree_gist` living in the exposed `public` schema
- unnecessary `SECURITY DEFINER` on `is_workspace_member`
- per-row `auth.uid()` re-evaluation warnings on nine RLS policies

Remaining security advisor findings are intentional:

1. Backend-only tables with RLS enabled and no client policies. These remain deny-by-default for normal clients.
2. `create_workspace_with_owner(...)` remains executable by authenticated users. This is intentional for V1 because the function itself enforces invite-only beta/founder access and one-workspace-per-user. Revisit when workspace creation is routed exclusively through the Nest backend.

## Performance advisor status

No remaining warning-level `auth_rls_initplan` findings after the policy hardening pass.

The advisor still reports informational unindexed foreign keys and unused indexes. Do not remove/add indexes blindly on an empty staging database; review these again after realistic beta traffic and query telemetry exist.

## Important migration-history caveat

The live staging schema was applied through direct SQL during the connected staging setup, so Supabase migration history is currently empty even though the schema is present.

Do **not** pretend migrations `0001`-`0013` are recorded remotely. Before using automated migration promotion to production, reconcile the remote migration history with the checked-in migration files using the supported Supabase CLI/MCP workflow in a networked engineering environment.

## Still required before TestFlight beta

1. Networked dependency install and full TypeScript/Nest/Expo builds.
2. Deploy the staging Nest API with secure server-side secrets.
3. Create controlled staging Auth users and bind Angel's Founder account deliberately.
4. Run authenticated two-tenant RLS/smoke tests against live staging.
5. Wire EAS staging environment variables without committing secrets.
6. Finish real device voice/push/large-video hardening.
7. Connect real provider OAuth/webhooks and production billing in later hardening phases.

## Staging Auth identity state

Staging currently has **0 Auth users**. No Founder identity has been assigned automatically. Angel should deliberately create/sign into the staging account before Founder binding and authenticated tenant-isolation tests.
