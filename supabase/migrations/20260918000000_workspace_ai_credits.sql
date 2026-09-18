-- AngelOS V1 credits meter. OpenAI calls cost 1 credit. Founder and Ollama plans do not burn Angel's OpenAI key cap.

create table if not exists public.workspace_ai_credits (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  plan_code text not null default 'free',
  period_start date not null,
  allowance integer not null default 0,
  used integer not null default 0 check (used >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_ai_credit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  delta integer not null,
  reason text not null,
  provider text,
  created_at timestamptz not null default now()
);
create index if not exists workspace_ai_credit_events_ws_idx
  on public.workspace_ai_credit_events (workspace_id, created_at desc);

alter table public.workspace_ai_credits enable row level security;
alter table public.workspace_ai_credit_events enable row level security;

create policy "members read their ai credits"
on public.workspace_ai_credits for select
using (public.is_workspace_member(workspace_id));

create policy "members read their ai credit events"
on public.workspace_ai_credit_events for select
using (public.is_workspace_member(workspace_id));
