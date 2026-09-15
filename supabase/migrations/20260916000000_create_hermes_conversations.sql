-- Hermes conversation memory table
-- Stores user/assistant turns per user for multi-session context.

create table if not exists public.hermes_conversations (
  id bigserial primary key,
  user_id text not null,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_hermes_conv_user_id on public.hermes_conversations (user_id);
create index if not exists idx_hermes_conv_created_at on public.hermes_conversations (user_id, created_at);

-- Optional: enable RLS if you want per-user isolation via auth
alter table public.hermes_conversations enable row level security;

-- Simple policy: users can only see their own rows (adjust as needed)
create policy if not exists "Users can select own conversations"
  on public.hermes_conversations
  for select
  using (auth.uid()::text = user_id);

create policy if not exists "Service role can insert"
  on public.hermes_conversations
  for insert
  with check (true);
