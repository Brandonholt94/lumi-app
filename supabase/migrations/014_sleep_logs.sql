-- ─────────────────────────────────────────────────────────────
-- Migration 014: sleep_logs
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- One row per user per day (upserted each morning)
create table if not exists sleep_logs (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  log_date        date not null,         -- the date the user woke up (today)
  bedtime_hour    real not null,         -- fractional hour, e.g. 22.5 = 10:30pm
  wake_hour       real not null,         -- fractional hour, e.g. 6.5 = 6:30am
  quality         text check (quality in ('great', 'okay', 'rough')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (clerk_user_id, log_date)
);

create index if not exists sleep_logs_user_date
  on sleep_logs (clerk_user_id, log_date desc);
