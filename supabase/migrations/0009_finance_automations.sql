-- AngelOS Sprint 9: Finance + Automations.
-- Finance remains ledger-based: actual received money is never inferred from booked value.

alter table public.client_payment_entries
  add column if not exists idempotency_key text,
  add column if not exists correction_effect text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists client_payment_entries_idempotency_idx
  on public.client_payment_entries(workspace_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists client_payment_entries_workspace_occurred_idx
  on public.client_payment_entries(workspace_id, occurred_at desc);

create index if not exists client_payment_entries_appointment_idx
  on public.client_payment_entries(workspace_id, appointment_id, occurred_at desc)
  where appointment_id is not null;

alter table public.client_payment_entries
  drop constraint if exists client_payment_entries_correction_effect_check;
alter table public.client_payment_entries
  add constraint client_payment_entries_correction_effect_check
  check (
    correction_effect is null or correction_effect in ('increase_expected','decrease_expected','increase_income','decrease_income')
  );

alter table public.client_payment_entries
  drop constraint if exists client_payment_entries_appointment_workspace_fkey;
alter table public.client_payment_entries
  add constraint client_payment_entries_appointment_workspace_fkey
  foreign key (appointment_id, workspace_id)
  references public.appointments(id, workspace_id)
  on delete restrict;

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  category text not null check (category in ('appointment','messaging','aftercare','followup','finance','content','system')),
  trigger_type text not null check (trigger_type in ('appointment_confirmed','appointment_completed','followup_due','manual')),
  action_type text not null check (action_type in ('client_message','create_followup','owner_prompt')),
  enabled boolean not null default false,
  delay_minutes integer not null default 0 check (delay_minutes between 0 and 525600),
  routine_category text,
  conditions jsonb not null default '{}'::jsonb,
  action_config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create index if not exists automation_rules_workspace_trigger_idx
  on public.automation_rules(workspace_id, trigger_type, enabled);

create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  rule_id uuid not null,
  client_id uuid,
  appointment_id uuid,
  thread_id uuid,
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','running','succeeded','failed','cancelled','skipped','needs_owner')),
  idempotency_key text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key),
  foreign key (rule_id, workspace_id) references public.automation_rules(id, workspace_id) on delete cascade,
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade,
  foreign key (appointment_id, workspace_id) references public.appointments(id, workspace_id) on delete cascade,
  foreign key (thread_id, workspace_id) references public.message_threads(id, workspace_id) on delete restrict
);

create index if not exists automation_jobs_due_idx
  on public.automation_jobs(workspace_id, status, scheduled_for);

alter table public.automation_rules enable row level security;
alter table public.automation_jobs enable row level security;

create policy "members manage automation rules"
on public.automation_rules for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members read automation jobs"
on public.automation_jobs for select
using (public.is_workspace_member(workspace_id));

create policy "members create automation jobs"
on public.automation_jobs for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
