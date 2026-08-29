-- AngelOS Sprint 6: app-managed Media Library.
-- Device Photos/Camera are import sources; AngelOS keeps a private business copy.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'angelos-media',
  'angelos-media',
  false,
  262144000,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/x-m4v','application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  storage_bucket text not null default 'angelos-media',
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  media_type text not null check (media_type in ('image','video','document')),
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  source text not null default 'phone_photos'
    check (source in ('phone_photos','camera','phone_files','import','generated','other')),
  captured_at timestamptz,
  upload_status text not null default 'pending'
    check (upload_status in ('pending','uploaded','failed')),
  lifecycle_status text not null default 'active'
    check (lifecycle_status in ('active','archived','deleted')),
  marketing_permission text not null default 'unknown'
    check (marketing_permission in ('unknown','private','treatment_only','marketing_approved','limited')),
  marketing_scope jsonb not null default '{}'::jsonb,
  content_status text not null default 'unused'
    check (content_status in ('unused','reviewed','selected','ready','posted','archived')),
  checksum_sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (workspace_id, storage_path)
);

create index if not exists media_assets_workspace_created_idx on public.media_assets(workspace_id, created_at desc);
create index if not exists media_assets_workspace_content_idx on public.media_assets(workspace_id, content_status, created_at desc);
create index if not exists media_assets_workspace_capture_idx on public.media_assets(workspace_id, captured_at desc nulls last);

create unique index if not exists treatment_records_id_workspace_uidx on public.treatment_records(id, workspace_id);

create table if not exists public.media_asset_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  media_asset_id uuid not null,
  client_id uuid,
  appointment_id uuid,
  treatment_record_id uuid,
  role text not null default 'other'
    check (role in ('before','after','healed','touch_up','client_submitted','consultation','content_source','document','other')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (media_asset_id, workspace_id) references public.media_assets(id, workspace_id) on delete cascade,
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade,
  foreign key (appointment_id, workspace_id) references public.appointments(id, workspace_id) on delete restrict,
  foreign key (treatment_record_id, workspace_id) references public.treatment_records(id, workspace_id) on delete restrict
);

create index if not exists media_asset_links_client_idx on public.media_asset_links(workspace_id, client_id, created_at desc);
create index if not exists media_asset_links_appointment_idx on public.media_asset_links(workspace_id, appointment_id, created_at desc);
create index if not exists media_asset_links_asset_idx on public.media_asset_links(workspace_id, media_asset_id);

create table if not exists public.media_usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  media_asset_id uuid not null,
  usage_type text not null check (usage_type in ('content_selected','content_published','message_sent','exported','treatment_attached','other')),
  platform text,
  reference_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  foreign key (media_asset_id, workspace_id) references public.media_assets(id, workspace_id) on delete cascade
);

alter table public.media_assets enable row level security;
alter table public.media_asset_links enable row level security;
alter table public.media_usage_events enable row level security;

create policy "members manage media assets"
on public.media_assets for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage media asset links"
on public.media_asset_links for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members manage media usage events"
on public.media_usage_events for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

-- Private storage policies. Every object path starts with its workspace UUID.
create policy "workspace members can read media objects"
on storage.objects for select
using (
  bucket_id = 'angelos-media'
  and exists (select 1 from public.workspace_memberships wm where wm.user_id = auth.uid() and wm.workspace_id::text = (storage.foldername(name))[1])
);

create policy "workspace members can upload media objects"
on storage.objects for insert
with check (
  bucket_id = 'angelos-media'
  and exists (select 1 from public.workspace_memberships wm where wm.user_id = auth.uid() and wm.workspace_id::text = (storage.foldername(name))[1])
);

create policy "workspace members can update media objects"
on storage.objects for update
using (
  bucket_id = 'angelos-media'
  and exists (select 1 from public.workspace_memberships wm where wm.user_id = auth.uid() and wm.workspace_id::text = (storage.foldername(name))[1])
)
with check (
  bucket_id = 'angelos-media'
  and exists (select 1 from public.workspace_memberships wm where wm.user_id = auth.uid() and wm.workspace_id::text = (storage.foldername(name))[1])
);

create policy "workspace members can delete media objects"
on storage.objects for delete
using (
  bucket_id = 'angelos-media'
  and exists (select 1 from public.workspace_memberships wm where wm.user_id = auth.uid() and wm.workspace_id::text = (storage.foldername(name))[1])
);
