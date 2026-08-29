-- AngelOS Sprint 3 CRM + Client Memory.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text not null,
  email text,
  phone text,
  language text not null default 'en',
  status text not null default 'lead'
    check (status in ('lead','warm','booking_intent','booked','active','returning','inactive')),
  source text,
  do_not_auto_message boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create index if not exists clients_workspace_name_idx on public.clients(workspace_id, display_name);
create index if not exists clients_workspace_status_idx on public.clients(workspace_id, status);
create index if not exists clients_workspace_email_idx on public.clients(workspace_id, lower(email)) where email is not null;

create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null,
  note_type text not null default 'general'
    check (note_type in ('general','internal','preference','consultation','aftercare')),
  content text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade
);

create table if not exists public.treatment_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null,
  appointment_id uuid,
  service_name text not null,
  stage text not null default 'first_session'
    check (stage in ('first_session','touch_up','correction','cover_up','other')),
  technique text,
  performed_at timestamptz not null default now(),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  amended_at timestamptz,
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade
);

create index if not exists treatment_records_client_date_idx on public.treatment_records(client_id, performed_at desc);

create table if not exists public.client_consents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null,
  consent_type text not null
    check (consent_type in ('treatment','photo_video','marketing','model_student','policy_acknowledgement')),
  status text not null check (status in ('granted','denied','withdrawn')),
  scope jsonb not null default '{}'::jsonb,
  form_version text,
  signed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade
);

create table if not exists public.client_payment_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null,
  appointment_id uuid,
  entry_type text not null
    check (entry_type in ('expected','deposit','payment','discount','refund','correction')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null,
  method text,
  note text,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade
);

create table if not exists public.client_followups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null,
  reason text not null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','waiting','done','cancelled','expired')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  auto_message_allowed boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade
);

alter table public.clients enable row level security;
alter table public.client_notes enable row level security;
alter table public.treatment_records enable row level security;
alter table public.client_consents enable row level security;
alter table public.client_payment_entries enable row level security;
alter table public.client_followups enable row level security;

create policy "members manage clients"
on public.clients for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage client notes"
on public.client_notes for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage treatment records"
on public.treatment_records for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage client consents"
on public.client_consents for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage client payment entries"
on public.client_payment_entries for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage client followups"
on public.client_followups for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
