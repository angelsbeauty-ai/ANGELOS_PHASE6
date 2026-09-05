begin;

do $guard$
declare
  v_definition text;
  v_membership_guard text := $match$
  if not exists (
    select 1
    from public.workspace_memberships wm
    where wm.workspace_id = v_message.workspace_id
      and wm.user_id = p_actor_user_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'actor_not_workspace_member');
  end if;
$match$;
begin
  select pg_get_functiondef(p.oid)
  into v_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'review_client_control_draft'
    and pg_get_function_identity_arguments(p.oid) = 'p_message_id uuid, p_decision text, p_edited_body text, p_english_meaning text, p_reason text, p_actor_user_id uuid, p_actor_type text';

  if v_definition is null then
    raise exception 'review_client_control_draft signature not found';
  end if;

  if position(v_membership_guard in v_definition) = 0 then
    raise exception 'review_client_control_draft has an unexpected authorization body';
  end if;

  v_definition := replace(
    v_definition,
    v_membership_guard,
    $replacement$
  if not exists (
    select 1
    from public.workspace_memberships wm
    where wm.workspace_id = v_message.workspace_id
      and wm.user_id = p_actor_user_id
      and wm.role = 'owner'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'angel_owner_required');
  end if;
$replacement$
  );

  execute v_definition;
end
$guard$;

revoke all on function public.review_client_control_draft(uuid, text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.review_client_control_draft(uuid, text, text, text, text, uuid, text) to service_role;

commit;
