-- AngelOS live-staging hardening discovered through Supabase security/performance advisors.
-- Safe to apply after migrations 0001-0012.

-- Keep relocatable extensions out of the exposed public schema.
create schema if not exists extensions;
do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'btree_gist' and n.nspname = 'public'
  ) then
    alter extension btree_gist set schema extensions;
  end if;
end
$$;

-- Membership lookup can rely on RLS; it does not need definer privileges.
alter function public.is_workspace_member(uuid) security invoker;

-- Workspace creation is intentionally callable by authenticated users because the
-- function itself enforces founder/beta approval and the V1 single-workspace rule.
-- Anonymous callers must never execute it.
revoke execute on function public.create_workspace_with_owner(text,text,text,text,text) from anon;

-- Trigger/helper SECURITY DEFINER functions must not be callable as Data API RPCs.
revoke execute on function public.attach_beta_workspace() from public, anon, authenticated;
revoke execute on function public.seed_ai_workspace_defaults() from public, anon, authenticated;
revoke execute on function public.seed_workspace_operational_controls() from public, anon, authenticated;
revoke execute on function public.seed_workspace_subscription() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Cache auth.uid() once per statement in RLS policies to avoid per-row re-evaluation.
drop policy if exists "members can view their own memberships" on public.workspace_memberships;
create policy "members can view their own memberships"
on public.workspace_memberships for select
using (user_id = (select auth.uid()));

drop policy if exists "members propose ai memory" on public.ai_memory_items;
create policy "members propose ai memory"
on public.ai_memory_items for insert
with check (
  public.is_workspace_member(workspace_id)
  and created_by = (select auth.uid())
  and status = 'proposed'
  and approved_by is null
  and approved_at is null
);

drop policy if exists "members manage conversations" on public.ai_conversations;
create policy "members manage conversations"
on public.ai_conversations for all
using (public.is_workspace_member(workspace_id))
with check (
  public.is_workspace_member(workspace_id)
  and created_by = (select auth.uid())
);

drop policy if exists "members insert own user messages" on public.ai_messages;
create policy "members insert own user messages"
on public.ai_messages for insert
with check (
  public.is_workspace_member(workspace_id)
  and author_type = 'user'
  and created_by = (select auth.uid())
);

drop policy if exists "members append appointment events" on public.appointment_events;
create policy "members append appointment events"
on public.appointment_events for insert
with check (
  public.is_workspace_member(workspace_id)
  and actor_user_id = (select auth.uid())
);

drop policy if exists "members create owner message drafts" on public.client_messages;
create policy "members create owner message drafts"
on public.client_messages for insert
with check (
  public.is_workspace_member(workspace_id)
  and created_by = (select auth.uid())
  and direction = 'outbound'
  and sender_type = 'owner'
  and status in ('draft','queued')
);

drop policy if exists "members manage message internal notes" on public.message_internal_notes;
create policy "members manage message internal notes"
on public.message_internal_notes for all
using (public.is_workspace_member(workspace_id))
with check (
  public.is_workspace_member(workspace_id)
  and created_by = (select auth.uid())
);

drop policy if exists "members append marketing coach runs" on public.marketing_coach_runs;
create policy "members append marketing coach runs"
on public.marketing_coach_runs for insert
with check (
  public.is_workspace_member(workspace_id)
  and created_by = (select auth.uid())
);

drop policy if exists "members create automation jobs" on public.automation_jobs;
create policy "members create automation jobs"
on public.automation_jobs for insert
with check (
  public.is_workspace_member(workspace_id)
  and created_by = (select auth.uid())
);
