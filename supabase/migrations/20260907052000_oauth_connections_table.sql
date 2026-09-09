-- oauth_connections: per-workspace provider access tokens (LINE, Meta Instagram/Facebook).
-- Service-role only: RLS is enabled with no policy, so non-bypassrls roles see zero rows.
-- service_role has bypassrls and is explicitly granted full privileges below.
-- In local/harness environments that lack service_role, the GRANT is a defensive no-op.
create table if not exists public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  provider text not null check (provider in ('line','instagram','facebook')),
  access_token text,
  access_expires_at timestamptz,
  scopes text,
  open_id text,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  last_error text,
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

-- integration_apps: per-workspace provider key/secret config (LINE + Meta).
-- client_key = channel token / App ID; client_secret = channel secret / App Secret.
-- Never logged, never returned in API responses.
create table if not exists public.integration_apps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  provider text not null check (provider in ('line','instagram','facebook')),
  client_key text not null,
  client_secret text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

alter table public.oauth_connections enable row level security;
alter table public.integration_apps enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on public.oauth_connections to service_role;
    grant select, insert, update, delete on public.integration_apps to service_role;
    grant select, insert, update, delete on public.message_send_attempts to service_role;
  end if;
end
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on public.oauth_connections from anon;
    revoke all on public.integration_apps from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on public.oauth_connections from authenticated;
    revoke all on public.integration_apps from authenticated;
  end if;
end
$$;
