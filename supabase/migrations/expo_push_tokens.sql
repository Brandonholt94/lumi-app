-- Expo push tokens for iOS and Android native push notifications
-- One row per device. Token is the unique key — same device re-registering
-- updates the existing row via upsert in the API route.

create table if not exists expo_push_tokens (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text not null,
  token          text not null unique,
  platform       text not null default 'ios', -- 'ios' | 'android'
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists expo_push_tokens_user_idx on expo_push_tokens (clerk_user_id);

-- RLS: users can only see their own tokens
alter table expo_push_tokens enable row level security;

create policy "Users can manage their own push tokens"
  on expo_push_tokens for all
  using (clerk_user_id = requesting_user_id());
