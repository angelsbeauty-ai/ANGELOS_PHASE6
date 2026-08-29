-- AngelOS Sprint 5 Unified Messaging + AI Receptionist.
-- Provider-neutral inbox with tenant isolation, client identity matching,
-- internal notes, approval-aware outbound messages, and idempotent send attempts.

create table if not exists public.messaging_channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('instagram','facebook','line','tiktok','manual')),
  display_name text not null,
  external_account_id text,
  status text not null default 'not_connected'
    check (status in ('not_connected','connected','degraded','needs_attention','disconnected','paused')),
  capabilities jsonb not null default '{}'::jsonb,
  auto_send_routine_enabled boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table if not exists public.client_channel_identities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null,
  channel_id uuid not null,
  external_user_id text not null,
  username text,
  display_name text,
  match_confidence text not null default 'verified'
    check (match_confidence in ('verified','possible','unverified')),
  created_at timestamptz not null default now(),
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade,
  foreign key (channel_id, workspace_id) references public.messaging_channels(id, workspace_id) on delete cascade,
  unique (workspace_id, channel_id, external_user_id)
);

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  client_id uuid,
  external_thread_id text not null,
  contact_external_user_id text,
  contact_display_name text,
  status text not null default 'needs_reply'
    check (status in ('needs_reply','waiting_client','booking_in_progress','needs_owner','follow_up_due','done','spam_scam')),
  intent text not null default 'unknown'
    check (intent in ('unknown','inquiry','booking','reschedule','location','aftercare','student','price','complaint','follow_up')),
  priority text not null default 'today' check (priority in ('urgent','today','later')),
  needs_owner boolean not null default false,
  summary text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (channel_id, workspace_id) references public.messaging_channels(id, workspace_id) on delete cascade,
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete set null,
  unique (workspace_id, channel_id, external_thread_id),
  unique (id, workspace_id)
);

create table if not exists public.client_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_id uuid not null,
  client_id uuid,
  direction text not null check (direction in ('inbound','outbound')),
  sender_type text not null check (sender_type in ('client','owner','ai','system')),
  external_message_id text,
  body text not null,
  original_language text,
  translated_body text,
  status text not null default 'received'
    check (status in ('received','draft','pending_approval','queued','sent','failed','cancelled')),
  sensitive boolean not null default false,
  routine_category text check (routine_category is null or routine_category in ('faq','booking_confirmation','appointment_reminder','aftercare','follow_up')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  foreign key (thread_id, workspace_id) references public.message_threads(id, workspace_id) on delete cascade,
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete set null,
  unique (workspace_id, external_message_id)
);

create table if not exists public.message_internal_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_id uuid not null,
  content text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (thread_id, workspace_id) references public.message_threads(id, workspace_id) on delete cascade
);

create table if not exists public.message_send_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  message_id uuid not null references public.client_messages(id) on delete cascade,
  channel_id uuid not null,
  idempotency_key text not null,
  attempt_no integer not null default 1 check (attempt_no > 0),
  status text not null check (status in ('queued','sent','failed','unknown')),
  provider_response jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  foreign key (channel_id, workspace_id) references public.messaging_channels(id, workspace_id) on delete cascade,
  unique (workspace_id, idempotency_key)
);

create index if not exists message_threads_workspace_status_idx on public.message_threads(workspace_id, status, last_message_at desc);
create index if not exists client_messages_thread_created_idx on public.client_messages(thread_id, created_at);
create index if not exists client_channel_identities_client_idx on public.client_channel_identities(workspace_id, client_id);

alter table public.messaging_channels enable row level security;
alter table public.client_channel_identities enable row level security;
alter table public.message_threads enable row level security;
alter table public.client_messages enable row level security;
alter table public.message_internal_notes enable row level security;
alter table public.message_send_attempts enable row level security;

create policy "members manage messaging channels" on public.messaging_channels for all
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members manage client channel identities" on public.client_channel_identities for all
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members manage message threads" on public.message_threads for all
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read client messages" on public.client_messages for select
using (public.is_workspace_member(workspace_id));
create policy "members create owner message drafts" on public.client_messages for insert
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
  and direction = 'outbound'
  and sender_type = 'owner'
  and status in ('draft','queued')
);
-- Inbound messages, AI drafts, delivery state, translations, and verified provider IDs are backend-controlled.
create policy "members manage message internal notes" on public.message_internal_notes for all
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
create policy "members read send attempts" on public.message_send_attempts for select
using (public.is_workspace_member(workspace_id));
-- Send attempts are backend-controlled so users cannot forge provider delivery evidence.
