-- ─────────────────────────────────────────────────────────────
-- Migration 002: mood_logs + user_activity
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- mood_logs: every mood selection is recorded with a timestamp
-- Allows Lumi to know today's mood, mood history, and patterns over time
create table if not exists mood_logs (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  mood            text not null check (mood in ('foggy', 'okay', 'wired', 'drained')),
  created_at      timestamptz not null default now()
);

create index if not exists mood_logs_user_created
  on mood_logs (clerk_user_id, created_at desc);

-- user_activity: one row per user, updated on every app open
-- Used to detect when someone is returning after an absence
-- 48+ hours away → re-entry protocol in Lumi chat
create table if not exists user_activity (
  clerk_user_id   text primary key,
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- crisis_flags: already exists from migration 001
-- Included here as reference — do not re-run if table exists
-- create table if not exists crisis_flags ( ... )
