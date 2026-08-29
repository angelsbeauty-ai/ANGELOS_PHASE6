# AngelOS Deployment Pack — Phase 9

This checkpoint makes the NestJS staging API deployable through a standard Docker-capable host while preserving the existing Railway path.

## Source of truth

- Staging database: existing AngelOS staging Supabase project.
- Production Supabase project remains untouched.
- Public release remains invite-only / disabled until Founder approval.
- Never copy staging service-role or OpenAI secrets into the repository or mobile app.

## Required server environment

Set these only in the server host secret store:

- `NODE_ENV=staging`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (preferred; legacy anon key supported only for compatibility)
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_PROVIDER_MODE=openai`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `BILLING_DEMO_MODE=false`
- `CORS_ORIGINS` with the exact allowed web origins if any
- `TRUST_PROXY_HOPS=1` unless the chosen host documents a different proxy chain
- `RELEASE_SHA` when the host does not inject a Git commit identifier

The host provides `PORT`; AngelOS defaults to 3000 locally.

## Build and start

The repository includes `apps/api/Dockerfile`. Any Docker-capable host can build it from the repository root.

Expected runtime command in the image:

`node dist/main.js`

Expected probes:

- `GET /health` — process liveness only
- `GET /health/ready` — database-backed readiness

Do not route production traffic until `/health/ready` returns `status: ready`.

## First networked dependency install blocker

The current handoff does **not** contain a committed npm lockfile because the build sandbox could not reach the npm registry. The first networked engineering environment must:

1. run `npm install` from the repository root,
2. review the resolved dependency tree,
3. commit the generated `package-lock.json`,
4. run the full typecheck/build/Expo Doctor gates,
5. then update the Docker build to `npm ci` for deterministic releases.

Do not treat a Docker image built from floating semver ranges as production-ready.

## Deployment acceptance

After the host gives the API an HTTPS URL:

```bash
STAGING_API_URL=https://<host> npm run test:post-deploy
```

Then run the authenticated two-tenant acceptance suite with the staging test users:

```bash
npm run test:staging
```

The authenticated suite proves API workspace visibility matches direct Supabase RLS visibility and that tenant A cannot see tenant B.

## Production promotion rule

A successful staging deploy is not authorization to switch the production Supabase project, enable public signup, connect live billing, or invite outside beta testers. Those remain separate founder-controlled gates.
