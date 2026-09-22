-- Agent module migrations
-- Run after existing migrations are applied

begin;

-- Agent orchestrator tasks
create table if not exists public.agent_orchestrator_tasks (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_message text not null,
  intent text not null,
  requires_approval boolean not null default false,
  status text not null default 'queued' check (status in ('queued', 'assigned', 'in_progress', 'completed', 'failed', 'awaiting_approval')),
  assigned_bot text,
  assigned_sub_agent text,
  result jsonb,
  error text,
  confidence double precision,
  approval_status text check (approval_status is null or approval_status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agent sub-agent tasks
create table if not exists public.agent_sub_agent_tasks (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  orchestrator_task_id uuid not null references public.agent_orchestrator_tasks(id) on delete cascade,
  bot text not null check (bot in ('angels_beauty', 'academy', 'angelos', 'general')),
  sub_agent text not null,
  intent text not null,
  task_description text not null,
  status text not null default 'queued' check (status in ('queued', 'assigned', 'in_progress', 'completed', 'failed', 'awaiting_approval')),
  result jsonb,
  error text,
  confidence double precision,
  requires_approval boolean not null default false,
  approval_status text check (approval_status is null or approval_status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agent learning rules
create table if not exists public.agent_learning_rules (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scope text not null check (scope in ('global', 'angels_beauty', 'academy', 'angelos', 'capability', 'bot')),
  scope_value text,
  rule_text text not null,
  source text not null default 'user_correction' check (source in ('user_correction', 'system', 'manual')),
  confirmed boolean not null default false,
  confirmed_by uuid references public.users(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies (workspace members can manage their own agent data)

-- agent_orchestrator_tasks
alter table public.agent_orchestrator_tasks enable row level security;

create policy "workspace_members_read_own_tasks" on public.agent_orchestrator_tasks
  for select using (
    exists (select 1 from public.workspace_memberships where workspace_id = agent_orchestrator_tasks.workspace_id and user_id = auth.uid())
  );

create policy "workspace_members_insert_tasks" on public.agent_orchestrator_tasks
  for insert with check (
    exists (select 1 from public.workspace_memberships where workspace_id = agent_orchestrator_tasks.workspace_id and user_id = auth.uid())
  );

create policy "workspace_members_update_own_tasks" on public.agent_orchestrator_tasks
  for update using (
    exists (select 1 from public.workspace_memberships where workspace_id = agent_orchestrator_tasks.workspace_id and user_id = auth.uid())
  );

-- agent_sub_agent_tasks
alter table public.agent_sub_agent_tasks enable row level security;

create policy "workspace_members_read_own_sub_tasks" on public.agent_sub_agent_tasks
  for select using (
    exists (select 1 from public.workspace_memberships where workspace_id = agent_sub_agent_tasks.workspace_id and user_id = auth.uid())
  );

create policy "workspace_members_insert_sub_tasks" on public.agent_sub_agent_tasks
  for insert with check (
    exists (select 1 from public.workspace_memberships where workspace_id = agent_sub_agent_tasks.workspace_id and user_id = auth.uid())
  );

-- agent_learning_rules
alter table public.agent_learning_rules enable row level security;

create policy "workspace_members_read_own_rules" on public.agent_learning_rules
  for select using (
    exists (select 1 from public.workspace_memberships where workspace_id = agent_learning_rules.workspace_id and user_id = auth.uid())
  );

create policy "workspace_members_manage_own_rules" on public.agent_learning_rules
  for all using (
    exists (select 1 from public.workspace_memberships where workspace_id = agent_learning_rules.workspace_id and user_id = auth.uid())
  );

commit;
