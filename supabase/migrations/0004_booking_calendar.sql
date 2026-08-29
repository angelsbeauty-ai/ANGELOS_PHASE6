-- AngelOS Sprint 4 Booking + Calendar.

create extension if not exists btree_gist;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes between 5 and 1440),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes between 0 and 240),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes between 0 and 240),
  standard_price numeric(12,2) not null default 0 check (standard_price >= 0),
  currency text not null,
  active boolean not null default true,
  booking_rules jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table if not exists public.business_hours (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  is_closed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, day_of_week),
  check (is_closed or (start_time is not null and end_time is not null and start_time < end_time))
);

create table if not exists public.calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  block_type text not null check (block_type in ('hard','soft','personal','student','content','other')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (start_at < end_at)
);

create index if not exists calendar_blocks_workspace_window_idx on public.calendar_blocks(workspace_id, start_at, end_at);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null,
  service_id uuid,
  service_name text not null,
  duration_minutes integer not null check (duration_minutes between 5 and 1440),
  buffer_before_minutes integer not null default 0,
  buffer_after_minutes integer not null default 0,
  price_snapshot numeric(12,2) not null default 0 check (price_snapshot >= 0),
  currency text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  busy_start_at timestamptz not null,
  busy_end_at timestamptz not null,
  status text not null default 'confirmation_pending'
    check (status in ('request','confirmation_pending','confirmed','arrival_info_sent','checked_in','completed','cancelled','no_show')),
  source text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete restrict,
  foreign key (service_id, workspace_id) references public.services(id, workspace_id) on delete restrict,
  check (start_at < end_at),
  check (busy_start_at <= start_at and busy_end_at >= end_at)
);

create index if not exists appointments_workspace_start_idx on public.appointments(workspace_id, start_at);
create index if not exists appointments_client_start_idx on public.appointments(client_id, start_at desc);

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    workspace_id with =,
    tstzrange(busy_start_at, busy_end_at, '[)') with &&
  )
  where (status in ('confirmation_pending','confirmed','arrival_info_sent','checked_in'));

create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  appointment_id uuid not null,
  event_type text not null check (event_type in ('created','confirmed','rescheduled','cancelled','checked_in','completed','status_changed','note')),
  from_state jsonb,
  to_state jsonb,
  note text,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (appointment_id, workspace_id) references public.appointments(id, workspace_id) on delete cascade
);

create index if not exists appointment_events_appointment_idx on public.appointment_events(appointment_id, created_at);

alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.calendar_blocks enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;

create policy "members manage services" on public.services for all
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members manage business hours" on public.business_hours for all
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members manage calendar blocks" on public.calendar_blocks for all
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members manage appointments" on public.appointments for all
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read appointment events" on public.appointment_events for select
using (public.is_workspace_member(workspace_id));
-- Appointment history is append-only for normal users. Backend/user API can insert events, but no update/delete policy is granted.
create policy "members append appointment events" on public.appointment_events for insert
with check (public.is_workspace_member(workspace_id) and actor_user_id = auth.uid());
