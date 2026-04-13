-- ─────────────────────────────────────────────────────────────
-- Migration 011: swap time_of_day for scheduled_time on medications
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

alter table medications
  add column if not exists scheduled_time time;

-- Drop the old check constraint and column
alter table medications
  drop column if exists time_of_day;
