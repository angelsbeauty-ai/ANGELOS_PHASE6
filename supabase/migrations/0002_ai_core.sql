-- AngelOS Sprint 2 AI Core.
-- Adds assistant profile, role toggles, approved memory, conversations, messages,
-- and auditable action proposals. All rows remain workspace-isolated with RLS.

create table if not exists public.ai_assistant_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  display_name text not null default 'AngelOS',
  avatar_key text,
  personality_prompt text not null default '',
  primary_language text not null default 'en',
  tone text not null default 'warm_professional'
    check (tone in ('warm_professional','direct','calm','friendly','custom')),
  response_length text not null default 'balanced'
    check (response_length in ('concise','balanced','detailed')),
  proactivity text not null default 'balanced'
    check (proactivity in ('low','balanced','high')),
  floating_button_mode text not null default 'on'
    check (floating_button_mode in ('on','compact','off')),
  guidance_questions_enabled boolean not null default true,
  explain_recommendations boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_assistant_roles (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  role_key text not null
    check (role_key in ('personal_assistant','social_media_marketer','content_creator','business_manager','business_advisor','consultant')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, role_key)
);

create table if not exists public.ai_memory_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category text not null
    check (category in ('business_knowledge','preference','brand','workflow','marketing_learning')),
  content text not null,
  status text not null default 'proposed'
    check (status in ('proposed','approved','retired')),
  source text not null default 'user',
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null default 'New conversation',
  created_by uuid not null references auth.users(id) on delete cascade,
  current_screen text,
  current_entity_type text,
  current_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  author_type text not null check (author_type in ('user','assistant','system_action')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages(conversation_id, created_at);
create index if not exists ai_memory_workspace_status_idx
  on public.ai_memory_items(workspace_id, status, category);

create table if not exists public.ai_action_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  requested_by uuid not null references auth.users(id) on delete cascade,
  action_key text not null,
  risk_level text not null check (risk_level in ('low','medium','high')),
  status text not null default 'proposed'
    check (status in ('proposed','approved','running','succeeded','failed','cancelled')),
  input jsonb not null default '{}'::jsonb,
  result jsonb,
  verification jsonb,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_assistant_profiles enable row level security;
alter table public.ai_assistant_roles enable row level security;
alter table public.ai_memory_items enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_action_runs enable row level security;

-- V1 has owner-only workspace membership. Human-editable settings stay user-scoped,
-- while assistant output, durable-memory approval, and action-run mutations remain backend-controlled.
create policy "members manage assistant profile"
on public.ai_assistant_profiles for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage assistant roles"
on public.ai_assistant_roles for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members read ai memory"
on public.ai_memory_items for select
using (public.is_workspace_member(workspace_id));

create policy "members propose ai memory"
on public.ai_memory_items for insert
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
  and status = 'proposed'
  and approved_by is null
  and approved_at is null
);

create policy "members manage conversations"
on public.ai_conversations for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "members read messages"
on public.ai_messages for select
using (public.is_workspace_member(workspace_id));

create policy "members insert own user messages"
on public.ai_messages for insert
with check (
  public.is_workspace_member(workspace_id)
  and author_type = 'user'
  and created_by = auth.uid()
);

create policy "members read action runs"
on public.ai_action_runs for select
using (public.is_workspace_member(workspace_id));

create or replace function public.seed_ai_workspace_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_assistant_profiles(workspace_id, primary_language)
  values (new.id, coalesce(nullif(split_part(new.locale, '-', 1), ''), 'en'))
  on conflict (workspace_id) do nothing;

  insert into public.ai_assistant_roles(workspace_id, role_key, enabled)
  select new.id, role_key, true
  from unnest(array[
    'personal_assistant',
    'social_media_marketer',
    'content_creator',
    'business_manager',
    'business_advisor',
    'consultant'
  ]::text[]) as role_key
  on conflict (workspace_id, role_key) do nothing;

  return new;
end;
$$;

drop trigger if exists workspaces_seed_ai_defaults on public.workspaces;
create trigger workspaces_seed_ai_defaults
after insert on public.workspaces
for each row execute function public.seed_ai_workspace_defaults();

-- Backfill Sprint 1 workspaces created before this migration.
insert into public.ai_assistant_profiles(workspace_id, primary_language)
select id, coalesce(nullif(split_part(locale, '-', 1), ''), 'en')
from public.workspaces
on conflict (workspace_id) do nothing;

insert into public.ai_assistant_roles(workspace_id, role_key, enabled)
select w.id, r.role_key, true
from public.workspaces w
cross join unnest(array[
  'personal_assistant',
  'social_media_marketer',
  'content_creator',
  'business_manager',
  'business_advisor',
  'consultant'
]::text[]) as r(role_key)
on conflict (workspace_id, role_key) do nothing;
