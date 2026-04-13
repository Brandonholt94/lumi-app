-- ─────────────────────────────────────────────────────────────
-- Migration 010: medications + medication_logs
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- medications: user's saved medication list
create table if not exists medications (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  name            text not null,
  dose            text,
  time_of_day     text not null check (time_of_day in ('Morning', 'Midday', 'Afternoon', 'Evening', 'Bedtime')),
  created_at      timestamptz not null default now()
);

create index if not exists medications_user
  on medications (clerk_user_id, created_at);

-- medication_logs: one row per med per day when taken
create table if not exists medication_logs (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  medication_id   uuid not null references medications(id) on delete cascade,
  taken_date      date not null,
  taken_at        timestamptz not null default now(),
  unique (clerk_user_id, medication_id, taken_date)
);

create index if not exists medication_logs_user_date
  on medication_logs (clerk_user_id, taken_date desc);
