# Production Hardening Phase 3 — Live Staging Supabase

## Completed

- Selected the existing blank/default Supabase project as AngelOS **staging**.
- Left the separate project named **Angel OS** untouched as the future production target.
- Applied the V1 schema from migrations `0001` through `0012` to staging.
- Created the private `angelos-media` storage bucket and workspace-scoped Storage RLS.
- Verified 53 public application tables exist and 0 have RLS disabled.
- Verified release state remains `invite_only_beta` and public signup remains disabled.
- Verified the Solo plan values: $49/month, $490/year, 14-day trial.
- Ran Supabase security and performance advisors.
- Hardened public-function execution and moved `btree_gist` out of the exposed `public` schema.
- Converted `is_workspace_member` to SECURITY INVOKER.
- Optimized nine RLS policies to use `(select auth.uid())` and removed the advisor warning class.
- Added `0013_staging_security_hardening.sql` to source so the live staging fixes are represented in the repo.
- Updated migration verification to require the V1 migration set plus the staging hardening migration.
- Re-ran static, migration, secret, and staging-contract verification successfully.

## Current advisor posture

### Security

No anonymous SECURITY DEFINER RPC warnings remain.

Remaining findings are intentional:

- Several backend-only tables have RLS enabled with no client policies, which means normal clients are denied by default.
- `create_workspace_with_owner(...)` is intentionally executable by authenticated users in V1; the function itself enforces founder/beta approval and the one-workspace rule. Revisit when workspace creation moves exclusively behind the Nest backend.

### Performance

No remaining warning-level `auth_rls_initplan` findings.

Informational unindexed-FK and unused-index notices remain. Because staging has no realistic workload yet, index tuning is deferred until beta query/usage telemetry exists.

## Migration-history caveat

The live staging schema was applied through direct SQL during this connected setup. Supabase's remote migration list is therefore empty even though the schema is present.

This must be reconciled before automated migration promotion to production. Do not treat the current remote migration history as authoritative.

## Current staging identity state

Staging currently has **0 Auth users**. No Founder user has been assigned. This is intentional; founder/admin authorization should only be bound after Angel deliberately creates/signs into the staging account.

## Next blockers

1. Run dependency installation and complete Nest/Expo builds in a networked development environment.
2. Deploy the staging Nest API with secure server-side credentials.
3. Create/sign into the controlled Angel staging account and explicitly bind Founder access.
4. Create a second staging test identity and run authenticated two-tenant RLS isolation tests.
5. Configure EAS staging environment values without committing secrets.
6. Build/install the first staging app on a real iPhone/iPad.
7. Continue provider OAuth/webhook, billing, voice, push, and large-video hardening before outside beta.
