begin;

-- The initial Stage-3 hardening migration used a PostgreSQL function that is
-- not available in this project. Replace only that empty-object predicate.
do $repair$
declare
  v_definition text;
begin
  select pg_get_functiondef(p.oid)
    into v_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'save_client_control_draft'
    and pg_get_function_identity_arguments(p.oid) = 'p_thread_id uuid, p_source_message_id uuid, p_body text, p_english_meaning text, p_analysis jsonb, p_draft_key text';

  if v_definition is null then
    raise exception 'save_client_control_draft signature not found';
  end if;

  if position('jsonb_object_length(v_analysis) = 0' in v_definition) = 0 then
    raise exception 'expected analysis guard was not found';
  end if;

  v_definition := replace(
    v_definition,
    'jsonb_object_length(v_analysis) = 0',
    'v_analysis = ''{}''::jsonb'
  );

  execute v_definition;
end;
$repair$;

revoke all on function public.save_client_control_draft(uuid, uuid, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.save_client_control_draft(uuid, uuid, text, text, jsonb, text) to service_role;

commit;
