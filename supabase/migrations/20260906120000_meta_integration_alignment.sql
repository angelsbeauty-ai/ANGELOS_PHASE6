-- Align Meta developer-app credentials with the Meta transport implementation.
--
-- The Meta webhook must verify its signature before it can resolve a workspace,
-- so the developer App ID/App Secret are stored once as provider='meta'.
-- Per-workspace Instagram/Facebook access tokens remain in oauth_connections,
-- and account/page ids remain in messaging_channels.
--
-- This is intentionally a forward-only constraint change. It does not insert,
-- copy, expose, or modify any credential values.

alter table public.integration_apps
  drop constraint if exists integration_apps_provider_check;

alter table public.integration_apps
  add constraint integration_apps_provider_check
  check (provider in ('meta','instagram','facebook','tiktok','google','json2video'));
