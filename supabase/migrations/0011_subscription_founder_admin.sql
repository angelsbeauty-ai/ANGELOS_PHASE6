-- AngelOS Sprint 11: subscriptions, founder administration, feature flags, and privacy-safe product telemetry.
-- Billing provider state is backend-controlled. Members can read their subscription but cannot forge paid access.

create table if not exists public.subscription_plans (
  code text primary key,
  name text not null,
  currency text not null default 'USD',
  monthly_price_cents integer not null check (monthly_price_cents >= 0),
  yearly_price_cents integer not null check (yearly_price_cents >= 0),
  trial_days integer not null default 14 check (trial_days between 0 and 365),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.subscription_plans(code,name,currency,monthly_price_cents,yearly_price_cents,trial_days,active)
values ('solo','AngelOS Solo','USD',4900,49000,14,true)
on conflict (code) do update set
  name = excluded.name,
  currency = excluded.currency,
  monthly_price_cents = excluded.monthly_price_cents,
  yearly_price_cents = excluded.yearly_price_cents,
  trial_days = excluded.trial_days,
  active = excluded.active,
  updated_at = now();

create table if not exists public.workspace_subscriptions (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  plan_code text not null default 'solo' references public.subscription_plans(code),
  status text not null default 'trialing' check (status in ('trialing','active','past_due','read_only','expired')),
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly','yearly')),
  provider text not null default 'none',
  provider_customer_id text,
  provider_subscription_id text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  grace_ends_at timestamptz,
  cancelled_at timestamptz,
  read_only_started_at timestamptz,
  read_only_until timestamptz,
  discount_percent integer not null default 0 check (discount_percent between 0 and 100),
  discount_source text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  provider text,
  external_event_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider, external_event_id)
);
create index if not exists subscription_events_workspace_idx on public.subscription_events(workspace_id, created_at desc);

create table if not exists public.platform_founders (
  user_id uuid primary key references auth.users(id) on delete cascade,
  label text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_discount_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  email_hint text,
  discount_percent integer not null default 20 check (discount_percent between 1 and 100),
  created_by uuid not null references auth.users(id) on delete restrict,
  redeemed_workspace_id uuid references public.workspaces(id) on delete set null,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_feature_flags (
  key text primary key,
  name text not null,
  description text not null,
  enabled boolean not null default true,
  stage text not null default 'stable' check (stage in ('stable','beta','paused','off')),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.platform_feature_flags(key,name,description,enabled,stage) values
  ('ai_core','AI Core','AI assistant chat and guidance.',true,'stable'),
  ('messaging_send','Messaging Sends','Outbound messaging actions.',true,'beta'),
  ('content_publishing','Content Publishing','Publishing actions through configured adapters.',true,'beta'),
  ('automations_execution','Automation Execution','Background automation job execution.',true,'beta'),
  ('analytics_coach','Marketing Coach','Analytics interpretation and marketing recommendations.',true,'beta')
on conflict (key) do nothing;

create table if not exists public.workspace_feature_overrides (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  feature_key text not null references public.platform_feature_flags(key) on delete cascade,
  enabled boolean not null,
  reason text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, feature_key)
);

-- Privacy-safe usage analytics. No message contents, client names, notes, finances, or AI chat content belongs here.
create table if not exists public.product_usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (event_name in ('screen_view','screen_duration','feature_used','workflow_started','workflow_completed','workflow_abandoned','tap')),
  screen text,
  feature text,
  action_key text,
  outcome text,
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 86400000),
  created_at timestamptz not null default now()
);
create index if not exists product_usage_events_recent_idx on public.product_usage_events(created_at desc);
create index if not exists product_usage_events_workspace_idx on public.product_usage_events(workspace_id, created_at desc);

alter table public.subscription_plans enable row level security;
alter table public.workspace_subscriptions enable row level security;
alter table public.subscription_events enable row level security;
alter table public.platform_founders enable row level security;
alter table public.student_discount_invites enable row level security;
alter table public.platform_feature_flags enable row level security;
alter table public.workspace_feature_overrides enable row level security;
alter table public.product_usage_events enable row level security;

create policy "authenticated read active subscription plans"
on public.subscription_plans for select to authenticated
using (active = true);

create policy "members read their workspace subscription"
on public.workspace_subscriptions for select
using (public.is_workspace_member(workspace_id));

create policy "members read their subscription events"
on public.subscription_events for select
using (public.is_workspace_member(workspace_id));

create policy "authenticated read platform feature flags"
on public.platform_feature_flags for select to authenticated
using (true);

create policy "members read workspace feature overrides"
on public.workspace_feature_overrides for select
using (public.is_workspace_member(workspace_id));

-- Founder membership, discount tokens, subscription mutations, feature-flag mutations, and product telemetry writes are backend-controlled.

create or replace function public.seed_workspace_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial_days integer;
begin
  select trial_days into v_trial_days from public.subscription_plans where code = 'solo';
  insert into public.workspace_subscriptions(
    workspace_id, plan_code, status, billing_interval, provider,
    trial_started_at, trial_ends_at
  ) values (
    new.id, 'solo', 'trialing', 'monthly', 'none',
    now(), now() + make_interval(days => coalesce(v_trial_days, 14))
  ) on conflict (workspace_id) do nothing;
  return new;
end;
$$;

drop trigger if exists workspaces_seed_subscription on public.workspaces;
create trigger workspaces_seed_subscription
after insert on public.workspaces
for each row execute function public.seed_workspace_subscription();

insert into public.workspace_subscriptions(workspace_id, plan_code, status, billing_interval, provider, trial_started_at, trial_ends_at)
select w.id, 'solo', 'trialing', 'monthly', 'none', now(), now() + interval '14 days'
from public.workspaces w
left join public.workspace_subscriptions s on s.workspace_id = w.id
where s.workspace_id is null;
