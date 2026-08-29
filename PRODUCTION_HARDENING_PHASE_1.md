# AngelOS Production Hardening — Phase 1

## Goal
Turn the completed V1 feature scaffold into a staging-ready project without adding new product scope.

## Added in this phase
- Fail-fast API runtime environment validation.
- Production CORS allow-list requirement.
- Graceful API shutdown hooks and non-root container runtime.
- Separate liveness (`/health`) and database readiness (`/health/ready`) probes.
- Railway Docker deployment configuration.
- Expo EAS development/staging/production build profiles.
- Explicit React Native Supabase session persistence using AsyncStorage.
- GitHub Actions CI contract for install, typecheck, API build, and static production checks.
- Offline static verification script that can run in this restricted container.

## Environment contract
### API secrets (server only)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` when `AI_PROVIDER_MODE=openai`
- `FOUNDER_USER_IDS`

### Production safety requirements
- `NODE_ENV=production`
- `CORS_ORIGINS` must be explicitly configured.
- `AI_PROVIDER_MODE=mock` is rejected in production.
- `BILLING_DEMO_MODE=true` is rejected in production.
- Service-role and OpenAI credentials never enter the Expo client.

## Staging deployment order
1. Create a dedicated Supabase staging project.
2. Apply migrations `0001` through `0012` in order.
3. Create a Railway staging service from `apps/api/Dockerfile`.
4. Configure API staging secrets.
5. Confirm `/health` and `/health/ready` are healthy.
6. Configure EAS `staging` environment variables with staging Supabase + API URL.
7. Build an internal iOS staging build.
8. Run the full acceptance matrix before touching production.

## Still blocked in this container
This environment has no installed npm dependency tree and earlier registry access was unavailable, so this phase cannot honestly claim:
- full `npm ci`
- full TypeScript typecheck
- Nest production build
- Expo/EAS build
- real Supabase migration execution

CI is configured so those checks become mandatory as soon as the repo is in a normal networked environment.

## Phase 2 blockers before TestFlight beta
- Run dependency install and full type/build checks.
- Apply all migrations to staging and run RLS/tenant integration tests.
- Connect real OpenAI staging credentials and validate AI action paths.
- Add push notification device adapter.
- Add microphone/voice recording adapter.
- Add resumable large-video upload adapter.
- Connect real social provider OAuth/webhooks/capabilities.
- Connect real billing provider/webhooks.
- Add legal retention/delete/export production workflow.
