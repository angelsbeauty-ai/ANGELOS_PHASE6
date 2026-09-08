-- AngelOS Sprint 14: Hermes task tracking for n8n orchestration.
-- Tracks tasks created by n8n/Telegram that Hermes Builder executes,
-- and records their results so the Telegram bot can surface them.
--
-- Reuse existing AngelOS patterns:
-- - workspace_id NOT NULL + RLS (is_workspace_member)
-- - created_by references auth.users(id)
-- - status enum + timestamps
-- - n8n_result stores the serialized result (JSONB) — what the Telegram bot shows

create table if not exists public.hermes_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  -- How the task arrived
  source text not null default 'telegram' check (source in ('telegram','angelos_ui','api','n8n')),
  source_ref text,              -- Telegram message_id, or UI session id, or n8n execution id
  source_channel text,          -- telegram, or future: angelos_web, angelos_mobile

  -- What Angel asked for
  intent text not null default 'chat',   -- chat | build | fix | review | status | blockers | next | plan | execute
  task_text text not null,               -- the actual request text from Angel
  task_json jsonb,                       -- structured form if n8n parsed it (goal, files, area, etc.)

  -- Task lifecycle
  status text not null default 'queued' check (status in (
    'queued','assigned','in_progress','awaiting_approval','approved','rejected',
    'building','testing','done','failed','cancelled','timeout'
  )),

  -- Hermes execution tracking
  hermes_session_id text,               -- Hermes conversation/session id if applicable
  hermes_result jsonb,                  -- what Hermes returned (diff summary, files changed, test results)
  hermes_error text,                    -- if failed
  hermes_started_at timestamptz,
  hermes_finished_at timestamptz,

  -- Human-in-the-loop
  needs_owner_approval boolean not null default false,
  approval_status text,                 -- pending | approved | rejected | skipped
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,

  -- For n8n to poll / callback
  n8n_execution_id text,                -- n8n execution id if n8n spawned this
  n8n_callback_url text,                -- where to POST result when done
  n8n_status text,                      -- queued | running | done | failed (n8n-side mirror)

  -- Ownership
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One task per (workspace, source_ref) so retries don't duplicate
  unique (workspace_id, source_ref)
);

-- Performance
create index if not exists hermes_tasks_workspace_status_idx
  on public.hermes_tasks(workspace_id, status, created_at desc);

create index if not exists hermes_tasks_source_ref_idx
  on public.hermes_tasks(workspace_id, source, source_ref);

-- RLS: members can read/write their own workspace's tasks
alter table public.hermes_tasks enable row level security;

create policy "workspace members read hermes tasks"
  on public.hermes_tasks for select
  using (public.is_workspace_member(workspace_id));

create policy "workspace members insert hermes tasks"
  on public.hermes_tasks for insert
  with check (public.is_workspace_member(workspace_id));

create policy "workspace members update hermes tasks"
  on public.hermes_tasks for update
  using (public.is_workspace_member(workspace_id));

-- Backend (service_role) can do everything — used by n8n webhook + Hermes exec
create policy "service role full access hermes tasks"
  on public.hermes_tasks for all
  using (true)
  with check (true);

-- Seed operational controls for existing workspaces (idempotent)
insert into public.workspace_operational_controls(workspace_id)
  select id from public.workspaces
  on conflict (workspace_id) do nothing;
