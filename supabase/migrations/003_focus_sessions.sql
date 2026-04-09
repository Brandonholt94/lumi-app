-- ─────────────────────────────────────────────────────────────
-- Migration 003: focus_sessions
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- focus_sessions: one row per completed or ended-early session
-- Feeds Insights page (session count, total minutes, busiest day)
-- and Lumi's context (what the user has been working on)

create table if not exists focus_sessions (
  id                uuid        primary key default gen_random_uuid(),
  clerk_user_id     text        not null,
  started_at        timestamptz not null,
  ended_at          timestamptz not null,
  planned_duration  integer     not null,  -- seconds (what they selected)
  actual_duration   integer     not null,  -- seconds (how long they actually ran)
  completed         boolean     not null default false,  -- true = hit zero, false = ended early
  task_label        text,                 -- optional: what they typed as their focus task
  ambient_sound     text        not null default 'off' check (ambient_sound in ('off', 'rain', 'white', 'brown')),
  pauses            integer     not null default 0,
  thoughts_captured integer     not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists focus_sessions_user_created
  on focus_sessions (clerk_user_id, created_at desc);
