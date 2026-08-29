-- AngelOS Sprint 12: invite-only beta, private feedback, and founder-controlled launch gate.
-- Public launch is never automatic. Passing launch criteria only marks AngelOS ready for founder review.

create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  email_hint text,
  cohort text not null default 'outside' check (cohort in ('angels_beauty','student','outside','partner')),
  label text,
  region text,
  created_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.beta_testers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  invite_id uuid references public.beta_invites(id) on delete set null,
  cohort text not null check (cohort in ('angels_beauty','student','outside','partner')),
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default now(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  revoked_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists beta_testers_workspace_idx on public.beta_testers(workspace_id);
create index if not exists beta_testers_cohort_idx on public.beta_testers(cohort, approved_at desc);

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug','friction','idea','success','testimonial_candidate','support')),
  message text not null check (char_length(message) between 1 and 4000),
  rating integer check (rating is null or rating between 1 and 5),
  permission_to_contact boolean not null default false,
  permission_to_quote boolean not null default false,
  status text not null default 'new' check (status in ('new','reviewing','resolved','archived')),
  founder_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists beta_feedback_workspace_idx on public.beta_feedback(workspace_id, created_at desc);
create index if not exists beta_feedback_status_idx on public.beta_feedback(status, created_at desc);

create table if not exists public.platform_release_state (
  id text primary key default 'main' check (id = 'main'),
  stage text not null default 'invite_only_beta' check (stage in ('invite_only_beta','public_ready_review','public')),
  public_signup_enabled boolean not null default false,
  founder_approved_public_at timestamptz,
  founder_approved_public_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.platform_release_state(id,stage,public_signup_enabled)
values ('main','invite_only_beta',false)
on conflict (id) do nothing;

alter table public.beta_invites enable row level security;
alter table public.beta_testers enable row level security;
alter table public.beta_feedback enable row level security;
alter table public.platform_release_state enable row level security;

-- Beta invitations, tester approvals, feedback review, and release-state mutations are backend-controlled.
-- Users may read only their own tester access and feedback through API endpoints after authentication.

create or replace function public.attach_beta_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.beta_testers
  set workspace_id = new.workspace_id
  where user_id = new.user_id and workspace_id is null and revoked_at is null;
  return new;
end;
$$;

drop trigger if exists workspace_membership_attach_beta on public.workspace_memberships;
create trigger workspace_membership_attach_beta
after insert on public.workspace_memberships
for each row execute function public.attach_beta_workspace();

create or replace function public.redeem_beta_invite(
  p_token_hash text,
  p_user_id uuid,
  p_user_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.beta_invites%rowtype;
  v_now timestamptz := now();
begin
  select * into v_invite
  from public.beta_invites
  where token_hash = p_token_hash
  for update;

  if v_invite.id is null or v_invite.revoked_at is not null or v_invite.redeemed_at is not null then
    raise exception 'invalid_beta_invite';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at <= v_now then
    raise exception 'expired_beta_invite';
  end if;
  if v_invite.email_hint is not null and lower(v_invite.email_hint) <> lower(coalesce(p_user_email,'')) then
    raise exception 'beta_invite_email_mismatch';
  end if;

  insert into public.beta_testers(user_id,invite_id,cohort,approved_by,approved_at,revoked_at)
  values (p_user_id,v_invite.id,v_invite.cohort,v_invite.created_by,v_now,null)
  on conflict (user_id) do update set
    invite_id = excluded.invite_id,
    cohort = excluded.cohort,
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    revoked_at = null;

  update public.beta_invites
  set redeemed_by = p_user_id, redeemed_at = v_now
  where id = v_invite.id;

  return jsonb_build_object('approved',true,'cohort',v_invite.cohort,'approvedAt',v_now);
end;
$$;
revoke all on function public.redeem_beta_invite(text,uuid,text) from public, anon, authenticated;
grant execute on function public.redeem_beta_invite(text,uuid,text) to service_role;

-- Re-enforce workspace creation at the database boundary so invite-only beta cannot be bypassed
-- by calling the Supabase RPC directly from a client.
create or replace function public.create_workspace_with_owner(
  p_name text,
  p_business_type text,
  p_timezone text,
  p_currency text,
  p_locale text
)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace public.workspaces;
  v_public_signup boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select public_signup_enabled into v_public_signup
  from public.platform_release_state
  where id = 'main';

  if not coalesce(v_public_signup,false)
     and not exists (select 1 from public.platform_founders pf where pf.user_id = auth.uid())
     and not exists (select 1 from public.beta_testers bt where bt.user_id = auth.uid() and bt.revoked_at is null)
  then
    raise exception 'invite_only_beta';
  end if;

  if exists (select 1 from public.workspace_memberships wm where wm.user_id = auth.uid()) then
    raise exception 'v1_single_workspace_only';
  end if;

  if length(trim(p_name)) = 0 then
    raise exception 'Workspace name is required';
  end if;

  insert into public.workspaces(name, business_type, timezone, currency, locale)
  values (trim(p_name), p_business_type, p_timezone, p_currency, p_locale)
  returning * into new_workspace;

  insert into public.workspace_memberships(workspace_id, user_id, role)
  values (new_workspace.id, auth.uid(), 'owner');

  return new_workspace;
end;
$$;
revoke all on function public.create_workspace_with_owner(text,text,text,text,text) from public;
grant execute on function public.create_workspace_with_owner(text,text,text,text,text) to authenticated;

-- Extend the test window for personally approved beta cohorts without changing public pricing/trial rules.
create or replace function public.attach_beta_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cohort text;
  v_days integer;
begin
  update public.beta_testers
  set workspace_id = new.workspace_id
  where user_id = new.user_id and workspace_id is null and revoked_at is null
  returning cohort into v_cohort;

  if v_cohort is not null then
    v_days := case when v_cohort = 'student' then 30 when v_cohort in ('outside','partner') then 60 else 14 end;
    update public.workspace_subscriptions
    set trial_ends_at = greatest(coalesce(trial_ends_at, now()), now() + make_interval(days => v_days)),
        updated_at = now()
    where workspace_id = new.workspace_id and status = 'trialing';
  end if;
  return new;
end;
$$;
