-- Approval queue for owner-gated actions (client replies, content, bookings).
--
-- These tables were originally created directly in the Supabase dashboard, so the repo had no
-- record of them: a fresh environment came up without them and the approvals API failed at
-- runtime while still compiling cleanly. This migration captures the deployed schema exactly.
-- It is written idempotently so it is a no-op against the project where the tables already exist.

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('message', 'content', 'booking')),
  source_id text not null,
  source_channel text not null check (
    source_channel in ('line', 'instagram', 'facebook', 'tiktok', 'youtube', 'form', 'system')
  ),
  content text not null,
  client_id text not null,
  client_name text not null,
  context jsonb,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'needs_revision')
  ),
  action_required text not null default 'reply' check (
    action_required in ('reply', 'publish', 'confirm')
  ),
  decided_by uuid,
  decided_at timestamp,
  decision_notes text,
  revised_content text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  -- A redelivered inbound webhook must not queue the same item twice.
  constraint unique_source_per_workspace unique (workspace_id, type, source_id)
);

-- Audit trail: one row per real status transition, written by the API after the guarded update.
create table if not exists public.approval_history (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references public.approvals(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status_change text,
  changed_by uuid,
  changed_at timestamp not null default now(),
  notes text
);

create index if not exists idx_approvals_workspace on public.approvals (workspace_id);
create index if not exists idx_approvals_status on public.approvals (workspace_id, status);
create index if not exists idx_approvals_type on public.approvals (workspace_id, type);
create index if not exists idx_approvals_created_at on public.approvals (workspace_id, created_at desc);
-- The Approvals screen only ever reads the pending queue; keep that path on a partial index.
create index if not exists idx_approvals_pending on public.approvals (workspace_id, status)
  where status = 'pending';

create index if not exists idx_approval_history_approval_id on public.approval_history (approval_id);
create index if not exists idx_approval_history_workspace on public.approval_history (workspace_id);

alter table public.approvals enable row level security;
alter table public.approval_history enable row level security;

-- Same tenant-isolation model as every other AngelOS table. The mobile Approvals screen
-- subscribes to postgres_changes on public.approvals directly, so this policy is what scopes
-- realtime delivery per account, not just REST reads.
drop policy if exists workspace_isolation on public.approvals;
create policy workspace_isolation
on public.approvals for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists workspace_isolation on public.approval_history;
create policy workspace_isolation
on public.approval_history for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
