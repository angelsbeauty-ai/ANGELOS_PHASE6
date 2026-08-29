-- AngelOS Sprint 8: Analytics + AI Marketing Coach.
-- Metrics remain nullable when a platform does not expose them; AngelOS never fabricates missing analytics.

create table if not exists public.marketing_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  primary_goal text not null default 'bookings'
    check (primary_goal in ('reach','engagement','saves','profile_visits','inquiries','bookings','retention','brand_awareness')),
  target_client text,
  service_area text,
  city text,
  region text,
  country text,
  experience_level text not null default 'beginner'
    check (experience_level in ('beginner','intermediate','advanced')),
  content_preferences jsonb not null default '{}'::jsonb,
  local_context_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_variant_id uuid not null,
  captured_at timestamptz not null default now(),
  source text not null default 'manual_entry' check (source in ('manual_entry','provider_sync')),
  reach bigint check (reach is null or reach >= 0),
  impressions bigint check (impressions is null or impressions >= 0),
  views bigint check (views is null or views >= 0),
  watch_time_seconds numeric(14,2) check (watch_time_seconds is null or watch_time_seconds >= 0),
  average_watch_time_seconds numeric(12,2) check (average_watch_time_seconds is null or average_watch_time_seconds >= 0),
  likes bigint check (likes is null or likes >= 0),
  comments bigint check (comments is null or comments >= 0),
  saves bigint check (saves is null or saves >= 0),
  shares bigint check (shares is null or shares >= 0),
  profile_visits bigint check (profile_visits is null or profile_visits >= 0),
  link_clicks bigint check (link_clicks is null or link_clicks >= 0),
  dms bigint check (dms is null or dms >= 0),
  inquiries bigint check (inquiries is null or inquiries >= 0),
  bookings bigint check (bookings is null or bookings >= 0),
  revenue numeric(14,2) check (revenue is null or revenue >= 0),
  currency text,
  completion_rate numeric(6,5) check (completion_rate is null or (completion_rate >= 0 and completion_rate <= 1)),
  raw_metrics jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  foreign key (content_variant_id, workspace_id) references public.content_variants(id, workspace_id) on delete cascade
);

create index if not exists content_metric_snapshots_variant_idx
  on public.content_metric_snapshots(workspace_id, content_variant_id, captured_at desc);
create index if not exists content_metric_snapshots_captured_idx
  on public.content_metric_snapshots(workspace_id, captured_at desc);

create table if not exists public.audience_activity_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform text not null check (platform in ('instagram','facebook','tiktok','manual')),
  day_of_week integer not null check (day_of_week between 0 and 6),
  hour_local integer not null check (hour_local between 0 and 23),
  active_followers bigint not null check (active_followers >= 0),
  captured_at timestamptz not null default now(),
  source text not null default 'manual_entry' check (source in ('manual_entry','provider_sync')),
  raw_metrics jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists audience_activity_workspace_idx
  on public.audience_activity_snapshots(workspace_id, platform, captured_at desc);

create table if not exists public.marketing_coach_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  confidence text not null check (confidence in ('low','medium','high')),
  evidence jsonb not null default '{}'::jsonb,
  recommendation text not null,
  provider text,
  model text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists marketing_coach_runs_workspace_idx
  on public.marketing_coach_runs(workspace_id, created_at desc);

alter table public.marketing_profiles enable row level security;
alter table public.content_metric_snapshots enable row level security;
alter table public.audience_activity_snapshots enable row level security;
alter table public.marketing_coach_runs enable row level security;

create policy "members manage marketing profile"
on public.marketing_profiles for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage content analytics"
on public.content_metric_snapshots for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage audience activity"
on public.audience_activity_snapshots for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members read marketing coach runs"
on public.marketing_coach_runs for select
using (public.is_workspace_member(workspace_id));

create policy "members append marketing coach runs"
on public.marketing_coach_runs for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
