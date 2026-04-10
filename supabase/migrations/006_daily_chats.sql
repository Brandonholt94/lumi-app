-- Daily chat persistence — one row per user per day
-- Stores the full message array for today's Lumi conversation

create table if not exists daily_chats (
  id          uuid        default gen_random_uuid() primary key,
  clerk_user_id text      not null,
  date        text        not null,  -- YYYY-MM-DD (UTC)
  messages    jsonb       not null   default '[]'::jsonb,
  updated_at  timestamptz default now(),

  unique (clerk_user_id, date)
);

-- Row-level security (service role key bypasses this, but good practice)
alter table daily_chats enable row level security;

-- Index for fast per-user lookups
create index if not exists daily_chats_user_date_idx
  on daily_chats (clerk_user_id, date);
