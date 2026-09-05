-- Staging Flow 1 uses existing approvals, messages and send attempts.
-- Nothing is opted in by this migration. Service-only RPCs are SECURITY INVOKER.
alter table public.workspace_operational_controls add column flow1_staging_enabled boolean not null default false;
alter table public.message_send_attempts add column finished_at timestamptz;
alter table public.client_messages drop constraint client_messages_status_check;
alter table public.client_messages add constraint client_messages_status_check
  check (status in ('received','draft','pending_approval','queued','sent','failed','unknown','cancelled'));
alter table public.approvals drop constraint approvals_source_channel_check;
alter table public.approvals add constraint approvals_source_channel_check
  check (source_channel in ('line','instagram','facebook','tiktok','youtube','form','system','manual'));

-- The API owns decisions and their history. A mobile session cannot forge approval.
drop policy if exists workspace_isolation on public.approvals;
create policy approvals_owner_read on public.approvals for select to authenticated
  using (public.is_workspace_member(workspace_id));
drop policy if exists workspace_isolation on public.approval_history;
create policy approval_history_owner_read on public.approval_history for select to authenticated
  using (public.is_workspace_member(workspace_id));
revoke insert, update, delete on public.approvals, public.approval_history from anon, authenticated;
grant select on public.approvals, public.approval_history to authenticated;
grant all on public.approvals, public.approval_history to service_role;

create function public.flow1_assert_scope(p_workspace uuid, p_actor uuid)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare controls public.workspace_operational_controls;
begin
  if not exists (select 1 from public.workspace_memberships where workspace_id=p_workspace and user_id=p_actor and role='owner') then
    raise exception 'Flow 1 requires workspace owner' using errcode='42501';
  end if;
  select * into controls from public.workspace_operational_controls where workspace_id=p_workspace for share;
  if not found or not controls.flow1_staging_enabled then
    raise exception 'Flow 1 staging workspace is not enabled' using errcode='42501';
  end if;
  if controls.emergency_read_only or controls.pause_automations then
    raise exception 'Flow 1 execution is paused' using errcode='55000';
  end if;
end $$;

create function public.flow1_prepare_approval(p_workspace uuid, p_actor uuid, p_source uuid, p_content text, p_client text, p_channel text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare source public.client_messages; thread public.message_threads; channel public.messaging_channels;
  client public.clients; approval public.approvals; outbound_id uuid;
begin
  perform public.flow1_assert_scope(p_workspace,p_actor);
  select * into source from public.client_messages where workspace_id=p_workspace and id=p_source for update;
  if not found then raise exception 'Source message not found' using errcode='P0002'; end if;
  select * into thread from public.message_threads where workspace_id=p_workspace and id=source.thread_id for share;
  select * into channel from public.messaging_channels where workspace_id=p_workspace and id=thread.channel_id for share;
  select * into client from public.clients where workspace_id=p_workspace and id=source.client_id for share;
  if client.id is null or thread.client_id is distinct from client.id or client.id::text is distinct from p_client then
    raise exception 'Message client/thread mismatch' using errcode='22023';
  end if;
  if channel.provider is distinct from 'manual' or p_channel is distinct from 'manual'
    or channel.status is distinct from 'connected' or channel.capabilities->>'flow1_test' is distinct from 'true'
    or thread.external_thread_id not like 'synthetic:%' then
    raise exception 'Flow 1 permits only connected synthetic manual channels' using errcode='42501';
  end if;
  if not exists (select 1 from public.client_channel_identities where workspace_id=p_workspace
    and client_id=client.id and channel_id=channel.id and external_user_id=thread.contact_external_user_id and match_confidence='verified') then
    raise exception 'Verified channel identity required' using errcode='22023';
  end if;
  if p_content is null or length(btrim(p_content))=0 or length(p_content)>10000 then
    raise exception 'A bounded reply draft is required' using errcode='22023';
  end if;
  select * into approval from public.approvals where workspace_id=p_workspace and type='message' and source_id=p_source::text;
  if found then
    if approval.content is distinct from btrim(p_content) then raise exception 'Source already has a different approval draft' using errcode='22023'; end if;
    return to_jsonb(approval);
  end if;
  if source.direction='inbound' then
    insert into public.client_messages(workspace_id,thread_id,client_id,direction,sender_type,body,status,sensitive,created_by,metadata)
      values(p_workspace,thread.id,client.id,'outbound','ai',btrim(p_content),'pending_approval',source.sensitive or thread.needs_owner,p_actor,jsonb_build_object('flow1_staging',true,'inbound_message_id',source.id)) returning id into outbound_id;
  elsif source.direction='outbound' and source.status='pending_approval' and source.body=btrim(p_content) then
    outbound_id:=source.id;
  else raise exception 'Source is not an inbound message or pending reply draft' using errcode='22023';
  end if;
  insert into public.approvals(workspace_id,type,source_id,source_channel,content,client_id,client_name,action_required,context)
    values(p_workspace,'message',p_source::text,'manual',btrim(p_content),client.id::text,client.display_name,'reply',
      jsonb_build_object('flow1_staging',true,'outbound_message_id',outbound_id,'thread_id',thread.id,'channel_id',channel.id)) returning * into approval;
  return to_jsonb(approval);
end $$;

create function public.flow1_decide_approval(p_workspace uuid, p_actor uuid, p_approval uuid, p_decision text, p_notes text, p_revised text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare approval public.approvals;
begin
  perform public.flow1_assert_scope(p_workspace,p_actor);
  if p_decision not in ('approved','rejected','needs_revision') or p_decision is null then raise exception 'Invalid decision' using errcode='22023'; end if;
  select * into approval from public.approvals where workspace_id=p_workspace and id=p_approval for update;
  if not found then raise exception 'Approval not found' using errcode='P0002'; end if;
  if approval.type<>'message' or approval.context->>'flow1_staging' is distinct from 'true' then raise exception 'Not a staging message approval' using errcode='42501'; end if;
  if approval.status<>'pending' then
    if approval.status<>p_decision or approval.revised_content is distinct from nullif(btrim(p_revised),'') then raise exception 'Approval already decided differently' using errcode='55000'; end if;
    return to_jsonb(approval);
  end if;
  if p_revised is not null and (length(btrim(p_revised))=0 or length(p_revised)>10000) then raise exception 'Invalid revised reply' using errcode='22023'; end if;
  update public.approvals set status=p_decision,decision_notes=p_notes,decided_by=p_actor,decided_at=now(),updated_at=now(),revised_content=nullif(btrim(p_revised),'')
    where id=approval.id returning * into approval;
  insert into public.approval_history(approval_id,workspace_id,status_change,changed_by,notes)
    values(approval.id,p_workspace,'pending -> '||p_decision,p_actor,p_notes);
  return to_jsonb(approval);
end $$;

create function public.flow1_claim_execution(p_workspace uuid, p_actor uuid, p_approval uuid)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare approval public.approvals; message public.client_messages; thread public.message_threads;
  channel public.messaging_channels; attempt public.message_send_attempts; outbound_id uuid;
begin
  perform public.flow1_assert_scope(p_workspace,p_actor);
  select * into approval from public.approvals where workspace_id=p_workspace and id=p_approval for update;
  if not found then raise exception 'Approval not found' using errcode='P0002'; end if;
  if approval.status<>'approved' or approval.type<>'message' or approval.context->>'flow1_staging' is distinct from 'true' then
    raise exception 'Approved staging message required' using errcode='42501';
  end if;
  outbound_id:=(approval.context->>'outbound_message_id')::uuid;
  select * into message from public.client_messages where workspace_id=p_workspace and id=outbound_id for update;
  if not found then raise exception 'Outbound message not found' using errcode='P0002'; end if;
  select * into thread from public.message_threads where workspace_id=p_workspace and id=message.thread_id for share;
  select * into channel from public.messaging_channels where workspace_id=p_workspace and id=thread.channel_id for share;
  if message.direction<>'outbound' or message.client_id::text is distinct from approval.client_id
    or thread.client_id is distinct from message.client_id or thread.id::text is distinct from approval.context->>'thread_id'
    or channel.id::text is distinct from approval.context->>'channel_id' then
    raise exception 'Approved message routing changed' using errcode='22023';
  end if;
  if channel.provider is distinct from 'manual' or channel.status is distinct from 'connected'
    or channel.capabilities->>'flow1_test' is distinct from 'true' or thread.external_thread_id not like 'synthetic:%' then
    raise exception 'Only synthetic manual delivery is permitted' using errcode='42501';
  end if;
  if not exists(select 1 from public.client_channel_identities where workspace_id=p_workspace and channel_id=channel.id
    and client_id=message.client_id and external_user_id=thread.contact_external_user_id and match_confidence='verified') then
    raise exception 'Approved channel identity changed' using errcode='22023';
  end if;
  select * into attempt from public.message_send_attempts where workspace_id=p_workspace and idempotency_key='message:'||message.id;
  if found then return jsonb_build_object('claimed',false,'attempt',to_jsonb(attempt),'message',to_jsonb(message)); end if;
  if message.status<>'pending_approval' or message.body is distinct from approval.content then
    raise exception 'Reply changed or is no longer pending approval' using errcode='55000';
  end if;
  insert into public.message_send_attempts(workspace_id,message_id,channel_id,idempotency_key,attempt_no,status,provider_response)
    values(p_workspace,message.id,channel.id,'message:'||message.id,1,'unknown',jsonb_build_object('phase','claimed','approval_id',approval.id))
    on conflict(workspace_id,idempotency_key) do nothing returning * into attempt;
  if not found then
    select * into attempt from public.message_send_attempts where workspace_id=p_workspace and idempotency_key='message:'||message.id;
    return jsonb_build_object('claimed',false,'attempt',to_jsonb(attempt),'message',to_jsonb(message));
  end if;
  update public.client_messages set status='unknown',body=coalesce(approval.revised_content,approval.content)
    where id=message.id returning * into message;
  return jsonb_build_object('claimed',true,'attempt',to_jsonb(attempt),'message',to_jsonb(message),'provider',channel.provider,'externalThreadId',thread.external_thread_id);
end $$;

create function public.flow1_finish_execution(p_workspace uuid, p_attempt uuid, p_status text, p_external_id text, p_error text, p_response jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare attempt public.message_send_attempts; message public.client_messages;
begin
  -- Recording evidence remains allowed after an emergency pause; it never dispatches.
  if p_status not in ('sent','failed','unknown') or p_status is null then raise exception 'Invalid delivery status' using errcode='22023'; end if;
  if p_status='sent' and nullif(p_external_id,'') is null then raise exception 'Sent delivery requires provider evidence' using errcode='22023'; end if;
  select * into attempt from public.message_send_attempts where workspace_id=p_workspace and id=p_attempt for update;
  if not found then raise exception 'Send attempt not found' using errcode='P0002'; end if;
  if attempt.provider_response->>'approval_id' is null then raise exception 'Not a Flow 1 claim' using errcode='42501'; end if;
  if attempt.finished_at is not null then return to_jsonb(attempt); end if;
  update public.message_send_attempts set status=p_status,error_message=p_error,finished_at=now(),
    provider_response=attempt.provider_response||jsonb_build_object('phase','finished','external_message_id',p_external_id,'result',p_response)
    where id=attempt.id returning * into attempt;
  update public.client_messages set status=p_status, external_message_id=case when p_status='sent' then p_external_id else external_message_id end,
    sent_at=case when p_status='sent' then now() else null end
    where workspace_id=p_workspace and id=attempt.message_id returning * into message;
  if not found then raise exception 'Claimed message missing' using errcode='P0002'; end if;
  if p_status='sent' then
    update public.message_threads set status='waiting_client',needs_owner=false,last_message_at=now(),updated_at=now()
      where workspace_id=p_workspace and id=message.thread_id;
  end if;
  return to_jsonb(attempt);
end $$;

revoke all on function public.flow1_assert_scope(uuid,uuid) from public,anon,authenticated;
revoke all on function public.flow1_prepare_approval(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.flow1_decide_approval(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.flow1_claim_execution(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.flow1_finish_execution(uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.flow1_assert_scope(uuid,uuid) to service_role;
grant execute on function public.flow1_prepare_approval(uuid,uuid,uuid,text,text,text) to service_role;
grant execute on function public.flow1_decide_approval(uuid,uuid,uuid,text,text,text) to service_role;
grant execute on function public.flow1_claim_execution(uuid,uuid,uuid) to service_role;
grant execute on function public.flow1_finish_execution(uuid,uuid,text,text,text,jsonb) to service_role;
