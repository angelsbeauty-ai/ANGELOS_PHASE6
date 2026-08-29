-- AngelOS Sprint 7: Content + Social Marketing Engine.
-- One content idea can have multiple platform-specific variants.

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  objective text not null check (objective in ('reach','engagement','saves','profile_visits','inquiries','bookings','education','trust','availability')),
  primary_format text not null check (primary_format in ('reel','story','carousel','photo')),
  status text not null default 'draft'
    check (status in ('draft','prepared','approved','scheduled','publishing','published','analyzed','failed','archived')),
  source_goal text,
  strategy_reason text,
  editing_instructions jsonb not null default '{}'::jsonb,
  approval_note text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table if not exists public.content_post_media (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_post_id uuid not null,
  media_asset_id uuid not null,
  position integer not null default 0 check (position >= 0),
  role text not null default 'primary' check (role in ('primary','secondary','cover')),
  created_at timestamptz not null default now(),
  foreign key (content_post_id, workspace_id) references public.content_posts(id, workspace_id) on delete cascade,
  foreign key (media_asset_id, workspace_id) references public.media_assets(id, workspace_id) on delete restrict,
  unique (workspace_id, content_post_id, media_asset_id)
);

create table if not exists public.content_variants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_post_id uuid not null,
  platform text not null check (platform in ('instagram','facebook','tiktok','manual')),
  format text not null check (format in ('reel','story','carousel','photo')),
  hook text,
  caption text not null default '',
  cta text,
  hashtags text[] not null default '{}',
  scheduled_for timestamptz,
  status text not null default 'draft'
    check (status in ('draft','approved','scheduled','publishing','published','failed','archived')),
  capabilities_snapshot jsonb not null default '{}'::jsonb,
  rule_version text,
  provider_post_id text,
  live_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (content_post_id, workspace_id) references public.content_posts(id, workspace_id) on delete cascade,
  unique (id, workspace_id),
  unique (workspace_id, content_post_id, platform)
);

create table if not exists public.content_publish_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_variant_id uuid not null,
  idempotency_key text not null,
  attempt_no integer not null default 1 check (attempt_no > 0),
  status text not null check (status in ('queued','publishing','published','failed','unknown')),
  provider_response jsonb,
  verification jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  foreign key (content_variant_id, workspace_id) references public.content_variants(id, workspace_id) on delete cascade,
  unique (workspace_id, idempotency_key)
);

create index if not exists content_posts_workspace_status_idx on public.content_posts(workspace_id, status, updated_at desc);
create index if not exists content_variants_workspace_schedule_idx on public.content_variants(workspace_id, status, scheduled_for);
create index if not exists content_post_media_asset_idx on public.content_post_media(workspace_id, media_asset_id);

alter table public.content_posts enable row level security;
alter table public.content_post_media enable row level security;
alter table public.content_variants enable row level security;
alter table public.content_publish_attempts enable row level security;

create policy "members manage content posts" on public.content_posts for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage content post media" on public.content_post_media for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage content variants" on public.content_variants for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members read content publish attempts" on public.content_publish_attempts for select
using (public.is_workspace_member(workspace_id));
-- Publish attempts are backend-controlled so clients cannot forge provider success.
