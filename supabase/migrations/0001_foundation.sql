-- AngelOS Sprint 1 foundation schema.
-- Assumes Supabase Auth owns auth.users.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text,
  timezone text not null,
  currency text not null,
  locale text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create policy "members can view their workspaces"
on public.workspaces
for select
using (public.is_workspace_member(id));

create policy "members can view their own memberships"
on public.workspace_memberships
for select
using (user_id = auth.uid());

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
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
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

-- No direct INSERT policy is granted on workspaces/memberships.
-- Workspace creation must go through the authenticated function above.
