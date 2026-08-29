# AngelOS Production Hardening — Phase 5: Live Acceptance Gate

## Purpose

Move from a live staging database to a deployable, verifiable staging service without inventing external hosting access or creating founder identities silently.

## Completed in this checkpoint

- Re-verified current Railway config requirements against Railway's current docs.
- Confirmed `/health/ready` remains the deployment healthcheck path.
- Added server-only Founder bootstrap tooling that:
  - requires an already-created, confirmed Supabase Auth account;
  - looks up the exact account by email through the Auth Admin API;
  - assigns `platform_founders` using the service-role key only;
  - verifies the row after writing it;
  - refuses production bootstrap unless an explicit escape hatch is supplied.
- Added a Founder verification tool that also proves the private beta release gate remains `invite_only_beta` with public signup disabled.
- Added a sanitized live staging environment template.
- Preserved the rule that no `SUPABASE_SERVICE_ROLE_KEY` or OpenAI secret may enter the mobile bundle or source archive.

## Current external boundary

There is no deploy-capable Railway/Render/Fly/Vercel connector available in the current session. Therefore this checkpoint does **not** claim the NestJS API is publicly deployed.

A real API deployment requires a hosting account to receive these server-only values:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `AI_PROVIDER_MODE=openai`
- `NODE_ENV=staging`
- `BILLING_DEMO_MODE=false`

The host must supply its `PORT` value; AngelOS already reads `PORT` and listens on `0.0.0.0`.

## First live acceptance sequence

1. Deploy the existing API Dockerfile from `apps/api/Dockerfile`.
2. Wait for `GET /health/ready` to return HTTP 200.
3. Deliberately create/sign into the founder's staging account through Supabase Auth.
4. Run `node scripts/bootstrap-founder.mjs` from a trusted server shell with the staging service-role key.
5. Run `node scripts/verify-staging-founder.mjs`.
6. Create/redeem a beta invite for tester A and create workspace A.
7. Create/redeem a separate beta invite for tester B and create workspace B.
8. Run `node scripts/staging-smoke.mjs` with both accounts.
9. Accept only if the API and direct Supabase RLS views show zero cross-tenant visibility.

## Explicit non-claims

- No live hosting deployment has been performed from this session.
- No founder Auth user has been silently created.
- No service-role key has been written to the repo or archive.
- No public beta/public signup has been enabled.
