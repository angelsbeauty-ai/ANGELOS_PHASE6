# AngelOS Staging Runbook

This runbook turns the completed V1 scaffold into a real private staging environment. Do not reuse production credentials or production customer data.

## 1. Create the staging Supabase project

Create a dedicated AngelOS staging project. Keep its URL, anon key, service-role key, and database credentials separate from production.

From a networked developer machine with the Supabase CLI:

```bash
supabase login
supabase link --project-ref <STAGING_PROJECT_REF>
supabase db push --dry-run
supabase db push
```

All 12 migrations must apply in order. Never run ad-hoc schema edits in the dashboard without adding a migration back to the repository.

## 2. Create staging auth users

Create these staging-only accounts:

- Founder staging account (Angel)
- Tenant A test owner
- Tenant B test owner

Put only the Founder staging Supabase user UUID into the API `FOUNDER_USER_IDS` staging variable.

Use Founder Admin to create invite-only beta tokens for Tenant A and Tenant B, redeem them, and create one separate business workspace for each test owner.

## 3. Deploy the staging API to Railway

Use a dedicated Railway staging environment/service and this repository's `railway.json` + `apps/api/Dockerfile`.

Set these API variables in Railway staging:

```text
NODE_ENV=staging
PORT=3000
CORS_ORIGINS=<explicit staging web/admin origin if used>
TRUST_PROXY_HOPS=1
SUPABASE_URL=<staging>
SUPABASE_ANON_KEY=<staging>
SUPABASE_SERVICE_ROLE_KEY=<staging secret>
AI_PROVIDER_MODE=openai
OPENAI_API_KEY=<staging secret>
OPENAI_MODEL=gpt-5.6-terra
FOUNDER_USER_IDS=<founder staging auth UUID>
BILLING_DEMO_MODE=false
```

Railway should use `/health/ready` as its deployment healthcheck. A deployment is accepted only after database readiness returns HTTP 200.

Verify:

```bash
curl https://<staging-api>/health
curl https://<staging-api>/health/ready
```

The liveness response should identify the staging environment and deployment/release identifier.

## 4. Configure Expo/EAS staging environment

AngelOS uses the Expo `preview` environment for the `staging` build profile while keeping `EXPO_PUBLIC_APP_ENV=staging` so the app retains its separate Staging name/bundle ID.

Create these EAS `preview` variables:

```text
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL=<staging Supabase URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
EXPO_PUBLIC_API_URL=https://<staging-api>
```

Never put service-role or OpenAI keys in Expo/EAS client variables.

Build the internal iOS staging app:

```bash
cd apps/mobile
eas env:list --environment preview
eas build --platform ios --profile staging
```

## 5. Configure staging CI secrets

In the repository's GitHub `staging` environment, set:

```text
STAGING_API_URL
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_TEST_EMAIL_A
STAGING_TEST_PASSWORD_A
STAGING_TEST_EMAIL_B
STAGING_TEST_PASSWORD_B
```

Then run the `angelos-staging-verification` workflow manually.

The smoke test proves:
- API liveness/readiness
- real Supabase authentication
- authenticated AngelOS API access
- direct Supabase RLS visibility
- Tenant A/Tenant B isolation when both test accounts are supplied
- private-beta access state

## 6. Run the full acceptance matrix

Use `STAGING_ACCEPTANCE_MATRIX.md` on a physical iPhone/iPad. Critical failures block TestFlight beta.

Minimum command checks:

```bash
npm install --workspaces --include-workspace-root
npm run verify:static
npm run typecheck
npm run build:api
npm run test:staging
```

## 7. Do not promote staging to production yet

Staging can move toward TestFlight only after:
- all critical tenant/RLS tests pass
- no wrong-client messaging path exists
- double-booking and duplicate action protections pass
- AI verification behavior is proven against real OpenAI staging calls
- backup/restore is tested on staging data
- device adapters needed for the beta are complete

Production remains a separate environment with separate Supabase, Railway, EAS variables, keys, and data.
