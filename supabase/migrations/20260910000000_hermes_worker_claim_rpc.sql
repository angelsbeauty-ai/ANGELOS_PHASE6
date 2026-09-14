-- AngelOS Sprint 14: Hermes worker task claiming RPC.
-- Atomic claim: sets status=in_progress, n8n_execution_id=worker id,
-- and returns the claimed row. Only claims tasks NOT already claimed
-- by this worker (prevents double-execution across multiple workers).

create or replace function public.hermes_claim_task(
  p_worker_id text,
  p_repo_path text  -- informational only; stored for audit if needed
) returns setof public.hermes_tasks
language plpgsql
security definer
as $$
declare
  v_now timestamptz := now();
  v_exec_id text := 'worker-' || p_worker_id || '-' || extract(epoch from v_now)::bigint;
begin
  -- Claim the oldest claimable task NOT already claimed by this worker
  return query
  with candidate as (
    select t.*
    from public.hermes_tasks t
    where t.status in ('queued', 'assigned', 'in_progress')
      and (t.n8n_execution_id is null or t.n8n_execution_id not like 'worker-%')
    order by t.created_at asc
    limit 1
    for update skip locked
  )
  update public.hermes_tasks t
  set
    status = 'in_progress',
    n8n_status = 'in_progress',
    n8n_execution_id = v_exec_id,
    hermes_started_at = v_now,
    updated_at = v_now
  from candidate
  where t.id = candidate.id
  returning t.*;
end;
$$;

comment on function public.hermes_claim_task(text, text) is
  'Atomically claim one pending Hermes task for a local worker. Uses FOR UPDATE SKIP LOCKED to prevent double-claim across workers. Service-role only.';
