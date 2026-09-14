-- 0016_automation_events_treatment_recorded.sql
-- Extend automation_rules.trigger_type to include 'treatment_recorded'.
-- Drop and re-add the CHECK constraint (forward-only, idempotent via IF EXISTS/IF NOT EXISTS).
-- Seed two conservative treatment_recorded rules (disabled by default) that create
-- a client_followup + audit event only — no automatic outbound message.

begin;

-- 1. Drop the existing CHECK constraint on automation_rules.trigger_type (safe: IF EXISTS).
alter table public.automation_rules
  drop constraint if exists automation_rules_trigger_type_check;

-- 2. Re-add the CHECK constraint including 'treatment_recorded'.
alter table public.automation_rules
  add constraint automation_rules_trigger_type_check
  check (trigger_type in ('appointment_confirmed','appointment_completed','followup_due','manual','treatment_recorded'));

-- 3. Seed default treatment_recorded rules (disabled by default) if they don't exist yet.
--    These create a client_followup + automation_event only; no outbound message.
insert into public.automation_rules
  (id, workspace_id, name, category, trigger_type, action_type, enabled, delay_minutes, routine_category, action_config, created_by, created_at, updated_at)
select
  gen_random_uuid(),
  ws.id,
  r.name,
  r.category,
  r.trigger_type,
  r.action_type,
  false,            -- disabled by default — no automatic action until owner enables
  r.delay_minutes,
  r.routine_category,
  r.action_config,
  null,             -- created_by: leave null for system-seeded rules; owner can attribute later
  now(),
  now()
from (
  select
    ws.id
  from public.workspaces ws
  cross join lateral (
    values
      ('Treatment recorded — aftercare',        'aftercare',  'treatment_recorded', 'create_followup', 0,   'aftercare',  '{"reason":"Client just had a treatment recorded. Create a follow-up for owner review; no automatic outbound message."}'),
      ('Treatment recorded — follow-up flag',  'followup',  'treatment_recorded', 'create_followup', 0,   'follow_up',  '{"reason":"Treatment recorded. Flag for owner follow-up if the client has open needs. No automatic outbound message."}')
  ) as r(name, category, trigger_type, action_type, delay_minutes, routine_category, action_config)
) r
cross join public.workspaces ws
where not exists (
  select 1 from public.automation_rules ar
  where ar.workspace_id = ws.id
    and ar.trigger_type = r.trigger_type
    and ar.name = r.name
)
on conflict on constraint automation_rules_workspace_trigger_idx
  do nothing;

commit;
