-- Stage 3: strictly no-send LINE Client Control staging hardening.
-- This migration intentionally does not add a webhook, credential, transport, or send path.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if exists (
    select 1
    from public.client_messages
    where direction = 'outbound'
      and metadata ->> 'stage' = 'line_client_control_staging'
    group by thread_id, metadata ->> 'client_control_draft_key'
    having count(*) > 1
  ) then
    raise exception 'Cannot add Stage 3 draft uniqueness guard while duplicate draft keys exist';
  end if;
end;
$$;

create unique index client_messages_line_control_draft_key_uq
  on public.client_messages (
    thread_id,
    (metadata ->> 'client_control_draft_key')
  )
  where direction = 'outbound'
    and metadata ->> 'stage' = 'line_client_control_staging'
    and coalesce(metadata ->> 'client_control_draft_key', '') <> '';

alter table public.client_messages
  add constraint client_messages_line_control_no_send_check
  check (
    not (
      metadata ->> 'stage' = 'line_client_control_staging'
      and (
        status not in ('draft', 'pending_approval', 'cancelled')
        or sent_at is not null
        or coalesce(metadata ->> 'send_released', 'false') <> 'false'
      )
    )
  ) not valid;

alter table public.client_messages
  validate constraint client_messages_line_control_no_send_check;

create or replace function public.convert_thread_to_client(
  p_thread_id uuid,
  p_display_name text default null,
  p_language text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_thread record;
  v_provider text;
  v_client uuid;
  v_name text;
  v_identity_result jsonb;
  v_identity_status text;
  v_latest_message_id uuid;
  v_inbound_language text;
  v_language text;
  v_language_attention_key text;
begin
  select *
  into v_thread
  from public.message_threads
  where id = p_thread_id;

  if v_thread is null then
    return jsonb_build_object('ok', false, 'reason', 'thread_not_found');
  end if;

  select
    m.id,
    nullif(lower(trim(m.original_language)), '')
  into v_latest_message_id, v_inbound_language
  from public.client_messages m
  where m.thread_id = p_thread_id
    and m.direction = 'inbound'
  order by m.created_at desc
  limit 1;

  v_language := lower(nullif(trim(coalesce(p_language, '')), ''));
  if v_language is null then
    v_language := v_inbound_language;
  end if;
  if v_language is null or v_language not in ('ja', 'en', 'mixed', 'unknown') then
    v_language := 'unknown';
  end if;

  if v_language = 'unknown' then
    v_language_attention_key := 'client-control-language:' || p_thread_id::text || ':' || coalesce(v_latest_message_id::text, 'none');
    insert into public.attention_items (
      workspace_id,
      severity,
      category,
      managed_by,
      dedupe_key,
      title,
      summary,
      status,
      source_type,
      source_id,
      evidence,
      first_seen_at,
      last_seen_at,
      created_at,
      updated_at
    )
    values (
      v_thread.workspace_id,
      'today',
      'messaging',
      'workflow',
      v_language_attention_key,
      'Client message needs Angel language review',
      'Language could not be determined safely. No language has been assumed.',
      'open',
      'message_thread',
      p_thread_id,
      jsonb_build_object(
        'stage', 'line_client_control_staging',
        'thread_id', p_thread_id,
        'message_id', v_latest_message_id,
        'detected_language', v_language
      ),
      now(),
      now(),
      now(),
      now()
    )
    on conflict (workspace_id, dedupe_key) do update
      set severity = excluded.severity,
          summary = excluded.summary,
          evidence = excluded.evidence,
          last_seen_at = now(),
          updated_at = now();
  end if;

  if v_thread.client_id is not null then
    return jsonb_build_object(
      'ok', true,
      'created', false,
      'client_id', v_thread.client_id,
      'detected_language', v_language,
      'requires_angel', v_language = 'unknown'
    );
  end if;

  select provider
  into v_provider
  from public.messaging_channels
  where id = v_thread.channel_id;

  v_identity_result := public.resolve_person_identity(
    v_thread.workspace_id,
    null,
    null,
    v_thread.contact_external_user_id,
    v_thread.channel_id
  );
  v_identity_status := v_identity_result ->> 'status';

  if v_identity_status = 'matched' then
    v_client := (v_identity_result ->> 'client_id')::uuid;
    update public.message_threads
    set client_id = v_client,
        intent = 'inquiry',
        updated_at = now()
    where id = p_thread_id;

    update public.client_messages
    set client_id = v_client
    where thread_id = p_thread_id
      and client_id is null;

    return jsonb_build_object(
      'ok', true,
      'created', false,
      'client_id', v_client,
      'linked_existing', true,
      'detected_language', v_language,
      'requires_angel', v_language = 'unknown'
    );
  end if;

  if v_identity_status = 'ambiguous' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'ambiguous_identity',
      'requires_angel', true,
      'candidate_ids', v_identity_result -> 'candidate_ids',
      'message', 'Multiple existing clients match this external user ID. Angel must review and decide.'
    );
  end if;

  if v_identity_status = 'not_found' then
    v_name := coalesce(
      nullif(trim(coalesce(p_display_name, '')), ''),
      nullif(trim(coalesce(v_thread.contact_display_name, '')), ''),
      'Guest ' || left(coalesce(v_thread.contact_external_user_id, 'unknown'), 6)
    );

    insert into public.clients (
      workspace_id,
      display_name,
      language,
      status,
      source,
      do_not_auto_message,
      created_at,
      updated_at
    )
    values (
      v_thread.workspace_id,
      v_name,
      v_language,
      'lead',
      v_provider,
      false,
      now(),
      now()
    )
    returning id into v_client;

    insert into public.client_channel_identities (
      workspace_id,
      client_id,
      channel_id,
      external_user_id,
      display_name,
      match_confidence,
      created_at
    )
    values (
      v_thread.workspace_id,
      v_client,
      v_thread.channel_id,
      coalesce(v_thread.contact_external_user_id, 'unknown'),
      v_name,
      'unverified',
      now()
    );

    update public.message_threads
    set client_id = v_client,
        intent = 'inquiry',
        updated_at = now()
    where id = p_thread_id;

    update public.client_messages
    set client_id = v_client
    where thread_id = p_thread_id
      and client_id is null;

    return jsonb_build_object(
      'ok', true,
      'created', true,
      'client_id', v_client,
      'display_name', v_name,
      'provider', v_provider,
      'detected_language', v_language,
      'requires_angel', v_language = 'unknown'
    );
  end if;

  return jsonb_build_object('ok', false, 'reason', 'identity_resolution_unknown_status');
end;
$function$;

create or replace function public.save_client_control_draft(
  p_thread_id uuid,
  p_source_message_id uuid,
  p_body text,
  p_english_meaning text,
  p_analysis jsonb default '{}'::jsonb,
  p_draft_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_thread record;
  v_source_message_id uuid;
  v_draft_message_id uuid;
  v_existing_draft_id uuid;
  v_draft_key text;
  v_analysis jsonb := coalesce(p_analysis, '{}'::jsonb);
  v_sensitive boolean;
  v_client_message_english_meaning text;
  v_detected_language text;
  v_translation_method text;
  v_recommended_action text;
  v_translation_stored boolean := false;
begin
  if p_source_message_id is null then
    return jsonb_build_object('ok', false, 'reason', 'source_message_required');
  end if;

  if trim(coalesce(p_body, '')) = '' then
    return jsonb_build_object('ok', false, 'reason', 'draft_body_required');
  end if;

  if trim(coalesce(p_english_meaning, '')) = '' then
    return jsonb_build_object('ok', false, 'reason', 'english_meaning_required');
  end if;

  if jsonb_typeof(v_analysis) <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'analysis_must_be_object');
  end if;

  if jsonb_object_length(v_analysis) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'analysis_required');
  end if;

  if not (v_analysis ? 'intent')
    or jsonb_typeof(v_analysis -> 'intent') <> 'string'
    or trim(coalesce(v_analysis ->> 'intent', '')) = '' then
    return jsonb_build_object('ok', false, 'reason', 'analysis_intent_required');
  end if;

  if not (v_analysis ? 'urgency')
    or jsonb_typeof(v_analysis -> 'urgency') <> 'string'
    or trim(coalesce(v_analysis ->> 'urgency', '')) = '' then
    return jsonb_build_object('ok', false, 'reason', 'analysis_urgency_required');
  end if;

  if not (v_analysis ? 'sentiment')
    or jsonb_typeof(v_analysis -> 'sentiment') <> 'string'
    or trim(coalesce(v_analysis ->> 'sentiment', '')) = '' then
    return jsonb_build_object('ok', false, 'reason', 'analysis_sentiment_required');
  end if;

  if not (v_analysis ? 'treatment_or_topic')
    or jsonb_typeof(v_analysis -> 'treatment_or_topic') <> 'string'
    or trim(coalesce(v_analysis ->> 'treatment_or_topic', '')) = '' then
    return jsonb_build_object('ok', false, 'reason', 'analysis_treatment_or_topic_required');
  end if;

  if not (v_analysis ? 'requested_date_time')
    or jsonb_typeof(v_analysis -> 'requested_date_time') not in ('string', 'null') then
    return jsonb_build_object('ok', false, 'reason', 'analysis_requested_date_time_required');
  end if;

  if not (v_analysis ? 'risk_flags')
    or jsonb_typeof(v_analysis -> 'risk_flags') <> 'array' then
    return jsonb_build_object('ok', false, 'reason', 'analysis_risk_flags_required');
  end if;

  if jsonb_typeof(v_analysis -> 'sensitive') <> 'boolean' then
    return jsonb_build_object('ok', false, 'reason', 'analysis_sensitive_boolean_required');
  end if;
  v_sensitive := (v_analysis ->> 'sensitive')::boolean;

  if jsonb_typeof(v_analysis -> 'needs_angel') <> 'boolean' then
    return jsonb_build_object('ok', false, 'reason', 'analysis_needs_angel_boolean_required');
  end if;
  if (v_analysis ->> 'needs_angel')::boolean is distinct from true then
    return jsonb_build_object('ok', false, 'reason', 'analysis_needs_angel_must_be_true');
  end if;

  v_client_message_english_meaning := nullif(trim(coalesce(v_analysis ->> 'client_message_english_meaning', '')), '');
  if v_client_message_english_meaning is null then
    return jsonb_build_object('ok', false, 'reason', 'analysis_client_message_english_meaning_required');
  end if;

  v_detected_language := lower(nullif(trim(coalesce(v_analysis ->> 'detected_language', '')), ''));
  if v_detected_language is null
    or v_detected_language not in ('ja', 'en', 'mixed', 'unknown') then
    return jsonb_build_object('ok', false, 'reason', 'analysis_detected_language_required');
  end if;

  v_translation_method := nullif(trim(coalesce(v_analysis ->> 'translation_method', '')), '');
  if v_translation_method is null then
    return jsonb_build_object('ok', false, 'reason', 'analysis_translation_method_required');
  end if;

  v_recommended_action := coalesce(
    nullif(trim(coalesce(v_analysis ->> 'recommended_next_action', '')), ''),
    nullif(trim(coalesce(v_analysis ->> 'recommended_action', '')), '')
  );
  if v_recommended_action is null then
    return jsonb_build_object('ok', false, 'reason', 'analysis_recommended_action_required');
  end if;

  if jsonb_typeof(v_analysis -> 'send_released') <> 'boolean'
    or (v_analysis ->> 'send_released')::boolean is distinct from false then
    return jsonb_build_object('ok', false, 'reason', 'analysis_send_released_must_be_false');
  end if;

  v_analysis := v_analysis || jsonb_build_object(
    'detected_language', v_detected_language,
    'translation_method', v_translation_method,
    'recommended_action', v_recommended_action,
    'recommended_next_action', v_recommended_action,
    'send_released', false
  );

  select t.id, t.workspace_id, t.client_id
  into v_thread
  from public.message_threads t
  where t.id = p_thread_id;

  if v_thread.id is null then
    return jsonb_build_object('ok', false, 'reason', 'thread_not_found');
  end if;

  select m.id
  into v_source_message_id
  from public.client_messages m
  where m.id = p_source_message_id
    and m.thread_id = p_thread_id
    and m.direction = 'inbound';

  if v_source_message_id is null then
    return jsonb_build_object('ok', false, 'reason', 'source_inbound_message_not_found');
  end if;

  v_draft_key := coalesce(nullif(trim(p_draft_key), ''), p_source_message_id::text);
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(p_thread_id::text || ':' || v_draft_key)
  );

  select m.id
  into v_existing_draft_id
  from public.client_messages m
  where m.thread_id = p_thread_id
    and m.direction = 'outbound'
    and m.metadata ->> 'stage' = 'line_client_control_staging'
    and m.metadata ->> 'client_control_draft_key' = v_draft_key
  limit 1;

  if v_existing_draft_id is not null then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'draft_message_id', v_existing_draft_id,
      'status', 'pending_approval'
    );
  end if;

  perform public.record_client_message_translation(
    v_source_message_id,
    v_detected_language,
    v_client_message_english_meaning,
    v_translation_method
  );
  v_translation_stored := true;

  begin
    insert into public.client_messages (
      workspace_id,
      thread_id,
      client_id,
      direction,
      sender_type,
      body,
      status,
      sensitive,
      metadata,
      created_at
    )
    values (
      v_thread.workspace_id,
      p_thread_id,
      v_thread.client_id,
      'outbound',
      'ai',
      p_body,
      'pending_approval',
      v_sensitive,
      jsonb_build_object(
        'stage', 'line_client_control_staging',
        'client_control_draft_key', v_draft_key,
        'source_message_id', p_source_message_id,
        'english_meaning', p_english_meaning,
        'analysis', v_analysis,
        'approval_required', true,
        'send_released', false,
        'review_status', 'pending',
        'created_at', now()
      ),
      now()
    )
    returning id into v_draft_message_id;
  exception
    when unique_violation then
      select m.id
      into v_existing_draft_id
      from public.client_messages m
      where m.thread_id = p_thread_id
        and m.direction = 'outbound'
        and m.metadata ->> 'stage' = 'line_client_control_staging'
        and m.metadata ->> 'client_control_draft_key' = v_draft_key
      limit 1;

      if v_existing_draft_id is not null then
        return jsonb_build_object(
          'ok', true,
          'duplicate', true,
          'draft_message_id', v_existing_draft_id,
          'status', 'pending_approval'
        );
      end if;
      raise;
  end;

  update public.message_threads
  set status = 'needs_owner',
      needs_owner = true,
      updated_at = now()
  where id = p_thread_id;

  insert into public.approval_events (
    workspace_id,
    action_key,
    event_type,
    actor_type,
    evidence,
    created_at
  )
  values (
    v_thread.workspace_id,
    'client_message_reply',
    'requested',
    'system',
    jsonb_build_object(
      'stage', 'line_client_control_staging',
      'draft_message_id', v_draft_message_id,
      'source_message_id', p_source_message_id,
      'approval_required', true,
      'send_released', false,
      'analysis', v_analysis
    ),
    now()
  );

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'draft_message_id', v_draft_message_id,
    'thread_id', p_thread_id,
    'status', 'pending_approval',
    'approval_required', true,
    'send_released', false,
    'source_translation_stored', v_translation_stored
  );
end;
$function$;

create or replace function public.get_client_control_review_detail(
  p_workspace_id uuid,
  p_draft_message_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_draft record;
begin
  select
    m.id,
    m.workspace_id,
    m.thread_id,
    m.client_id,
    m.body,
    m.status,
    m.sensitive,
    m.metadata,
    m.created_at,
    t.status as thread_status,
    t.intent as thread_intent,
    t.priority as thread_priority,
    t.needs_owner,
    c.display_name as client_display_name,
    c.language as client_language,
    c.status as client_status,
    c.do_not_auto_message
  into v_draft
  from public.client_messages m
  join public.message_threads t on t.id = m.thread_id
  left join public.clients c on c.id = m.client_id
  where m.id = p_draft_message_id
    and m.workspace_id = p_workspace_id
    and m.direction = 'outbound'
    and m.metadata ->> 'stage' = 'line_client_control_staging';

  if v_draft.id is null then
    return jsonb_build_object('ok', false, 'reason', 'client_control_draft_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'draft', jsonb_build_object(
      'draft_message_id', v_draft.id,
      'thread_id', v_draft.thread_id,
      'suggested_reply', v_draft.body,
      'english_meaning', v_draft.metadata ->> 'english_meaning',
      'analysis', coalesce(v_draft.metadata -> 'analysis', '{}'::jsonb),
      'review_status', coalesce(v_draft.metadata ->> 'review_status', 'pending'),
      'message_status', v_draft.status,
      'sensitive', v_draft.sensitive,
      'approval_required', true,
      'send_released', false,
      'created_at', v_draft.created_at
    ),
    'source_message', coalesce((
      select jsonb_build_object(
        'message_id', s.id,
        'original_body', s.body,
        'original_language', s.original_language,
        'english_meaning', s.translated_body,
        'received_at', s.created_at
      )
      from public.client_messages s
      where s.thread_id = v_draft.thread_id
        and s.direction = 'inbound'
        and s.id::text = v_draft.metadata ->> 'source_message_id'
      limit 1
    ), 'null'::jsonb),
    'client', case
      when v_draft.client_id is null then null
      else jsonb_build_object(
        'id', v_draft.client_id,
        'display_name', v_draft.client_display_name,
        'language', v_draft.client_language,
        'status', v_draft.client_status,
        'do_not_auto_message', v_draft.do_not_auto_message
      )
    end,
    'thread', jsonb_build_object(
      'id', v_draft.thread_id,
      'status', v_draft.thread_status,
      'intent', v_draft.thread_intent,
      'priority', v_draft.thread_priority,
      'needs_owner', v_draft.needs_owner
    ),
    'client_context', public.get_client_control_context(v_draft.thread_id),
    'audit_history', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'event_type', e.event_type,
          'actor_type', e.actor_type,
          'actor_user_id', e.actor_user_id,
          'evidence', e.evidence,
          'created_at', e.created_at
        )
        order by e.created_at asc
      )
      from public.approval_events e
      where e.workspace_id = p_workspace_id
        and e.action_key = 'client_message_reply'
        and e.evidence ->> 'draft_message_id' = p_draft_message_id::text
    ), '[]'::jsonb)
  );
end;
$function$;

insert into public.action_policy_rules (
  workspace_id,
  action_key,
  action_class,
  requires_angel_approval,
  active,
  rationale,
  version
)
select distinct
  channel.workspace_id,
  'client_message_reply',
  'approval_sensitive',
  true,
  true,
  'All client-message reply drafts require Angel review. Stage 3 remains database-enforced no-send until a separately approved production transport gate exists.',
  1
from public.messaging_channels channel
where channel.provider = 'line'
on conflict (workspace_id, action_key, version) do update
  set action_class = excluded.action_class,
      requires_angel_approval = excluded.requires_angel_approval,
      active = excluded.active,
      rationale = excluded.rationale,
      updated_at = now();

revoke all on function public.convert_thread_to_client(uuid, text, text) from public, anon, authenticated;
grant execute on function public.convert_thread_to_client(uuid, text, text) to service_role;

revoke all on function public.save_client_control_draft(uuid, uuid, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.save_client_control_draft(uuid, uuid, text, text, jsonb, text) to service_role;

revoke all on function public.get_client_control_review_detail(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_client_control_review_detail(uuid, uuid) to service_role;

commit;
