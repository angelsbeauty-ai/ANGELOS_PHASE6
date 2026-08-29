# AngelOS Railway Staging Environment Checklist

Configure these as Railway service variables. Never commit the real values.

## Required server variables

- `NODE_ENV=staging`
- `PORT=3000` (Railway may inject its own `PORT`; the API accepts it)
- `TRUST_PROXY_HOPS=1`
- `CORS_ORIGINS=<staging web origin if/when one exists>`
- `SUPABASE_URL=https://hhzegavoyuicclsmrkwf.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=<staging publishable key>` (preferred; legacy `SUPABASE_ANON_KEY` remains a fallback)
- `SUPABASE_SERVICE_ROLE_KEY=<staging service-role/secret key>`
- `AI_PROVIDER_MODE=openai`
- `OPENAI_API_KEY=<server-only staging OpenAI key>`
- `OPENAI_MODEL=gpt-5.6-terra`
- `BILLING_DEMO_MODE=false`
- `FOUNDER_USER_IDS=<Angel's staging auth UUID after first deliberate sign-in>`

## Safety rules

- Never place `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` in Expo/EAS public variables.
- Do not use production Supabase secrets in staging.
- Keep the separate Supabase project named `Angel OS` untouched until promotion is deliberate.
- Run `npm run verify:deployment-env` in the deployed service environment before the first acceptance pass.

## Expected health checks

- `GET /health` -> process alive
- `GET /health/ready` -> API can reach required dependencies without exposing secret/error internals

Railway config already points its health check at `/health/ready`.
