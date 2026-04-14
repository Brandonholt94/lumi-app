-- ─────────────────────────────────────────────────────────────
-- Migration 012: update mood values
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- Drop old check constraint FIRST (before any data changes)
alter table mood_logs drop constraint if exists mood_logs_mood_check;

-- Migrate old 'foggy' → 'low' (closest match)
update mood_logs set mood = 'low' where mood = 'foggy';

-- Add new constraint with updated mood values
alter table mood_logs
  add constraint mood_logs_mood_check
  check (mood in ('drained', 'low', 'okay', 'bright', 'wired'));
