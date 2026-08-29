-- AngelOS Sprint 10: Needs Attention + System Health.
-- Health evidence is backend-controlled. Members can read it, but cannot forge healthy states.

create table if not exists public.system_health_components (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  component text not null,
  capability text not null default 'core',
  provider text,
  status text not null default 'unknown'
    check (status in ('healthy','degraded','needs_attention','disconnected','paused','unknown')),
  summary text not null,
  impact jsonb not null default '{}'::jsonb,
  details jsonb not null default '{}'::jsonb,
  action_path text,
  last_checked_at timestamptz not null default now(),
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, component, capability)
);

create index if not exists system_health_components_workspace_status_idx
  on public.system_health_components(workspace_id, status, last_checked_at desc);

create table if not exists public.attention_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  severity text not null check (severity in ('urgent','today','later')),
  category text not null check (category in ('system','integration','automation','messaging','content','booking','finance','security')),
  managed_by text not null default 'system_health' check (managed_by in ('system_health','workflow')),
  dedupe_key text not null,
  title text not null,
  summary text not null,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  source_type text,
  source_id uuid,
  action_path text,
  impact jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, dedupe_key)
);

create index if not exists attention_items_workspace_status_idx
  on public.attention_items(workspace_id, status, severity, last_seen_at desc);

create table if not exists public.workspace_operational_controls (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  pause_ai_actions boolean not null default false,
  pause_automations boolean not null default false,
  emergency_read_only boolean not null default false,
  reason text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.system_health_components enable row level security;
alter table public.attention_items enable row level security;
alter table public.workspace_operational_controls enable row level security;

create policy "members read system health"
on public.system_health_components for select
using (public.is_workspace_member(workspace_id));

create policy "members read attention items"
on public.attention_items for select
using (public.is_workspace_member(workspace_id));

create policy "members read operational controls"
on public.workspace_operational_controls for select
using (public.is_workspace_member(workspace_id));

-- Health evidence, attention lifecycle, and emergency-control mutations are backend-controlled.
-- This prevents a client from forging healthy states, resolving errors, or bypassing owner-only controls.

create or replace function public.seed_workspace_operational_controls()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_operational_controls(workspace_id)
  values (new.id)
  on conflict (workspace_id) do nothing;
  return new;
end;
$$;

drop trigger if exists workspaces_seed_operational_controls on public.workspaces;
create trigger workspaces_seed_operational_controls
after insert on public.workspaces
for each row execute function public.seed_workspace_operational_controls();

insert into public.workspace_operational_controls(workspace_id)
select id from public.workspaces
on conflict (workspace_id) do nothing;
