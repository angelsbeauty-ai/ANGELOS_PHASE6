# Sprint 11 Build Notes

## What was added

- `0011_subscription_founder_admin.sql`
  - Solo plan seed ($49 monthly / $490 yearly / 14-day trial)
  - workspace subscriptions and lifecycle event history
  - founder identity table
  - private student discount tokens
  - platform feature flags + workspace override foundation
  - privacy-safe product usage events
  - automatic trial seed for new and existing workspaces
- Subscription API + mobile Subscription screen.
- Global subscription write guard for read-only/expired workspaces.
- Founder-only API + Founder Admin mobile screen.
- Real platform feature guard for selected high-risk capabilities.
- Automatic route-level screen/time telemetry with UUID normalization.
- V1 one-workspace-per-account enforcement.

## Founder bootstrap

Founder Admin is intentionally not self-assignable. For the first founder account, set the authenticated Supabase user ID in `FOUNDER_USER_IDS` on the API, or provision the user into `platform_founders` through a trusted migration/admin process.

## Billing honesty

A billing adapter boundary exists, but production payment checkout is deliberately `not_configured` until a real provider is selected and tested. `BILLING_DEMO_MODE=true` may be used only in a non-production environment to test access transitions without charging money.

## Privacy boundary

Founder usage analytics receive generic screen/feature events only. Dynamic UUIDs are normalized before insertion. Sensitive workspace contents do not belong in `product_usage_events` and are not selected by Founder Admin.

## Validation performed here

- Repository-wide TS/TSX transpile/syntax check.
- Migration structure/RLS presence check.
- `git diff --check`.
- Full dependency-aware TypeScript build is still blocked in this container because project npm dependencies are not installed.
