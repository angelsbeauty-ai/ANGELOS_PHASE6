# AngelOS Production Hardening — Phase 2

## Goal
Make the V1 repository executable as a real staging validation pipeline without adding product scope.

## Completed in this phase
- Explicit EAS environment mapping: development → development, staging profile → preview, production → production.
- Trackable staging environment contracts for API/mobile with no real secrets committed.
- Manual GitHub staging verification workflow.
- Staging smoke runner using real Supabase Auth + AngelOS API + direct Supabase REST/RLS checks.
- Optional second-tenant isolation test.
- Secret scanning for common committed credential patterns.
- Public readiness endpoint now returns a safe error code instead of raw database errors.
- Health output identifies environment/release/deployment for staging verification.
- Detailed staging runbook and acceptance gate.

## Still requires external infrastructure/credentials
This sandbox cannot complete these actions without the owner's real service accounts/credentials:
- create/link the Supabase staging project and actually execute migrations
- deploy the Railway staging service
- create EAS project/environment values and run a cloud iOS build
- supply real OpenAI staging key
- create staging auth/test users and founder UUID

The npm registry is also unreachable from this sandbox, so the full dependency install/typecheck/Nest build cannot be run here. The CI/staging pipeline now makes those checks mandatory in a networked environment.

## Phase 2 exit criteria
Phase 2 is fully externally verified when:
1. `/health` and `/health/ready` are green in Railway staging.
2. All 12 migrations are applied to a dedicated staging Supabase project.
3. `npm run check` passes on a networked machine/CI.
4. `npm run test:staging` passes with Tenant A and Tenant B.
5. An EAS `staging` iOS build installs and signs in on a physical device.
6. The critical items in `STAGING_ACCEPTANCE_MATRIX.md` pass.
