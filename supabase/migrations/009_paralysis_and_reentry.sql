-- ─────────────────────────────────────────────────────────────
-- Migration 009: Paralysis detector + re-entry tracking
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- Track when a capture was first pinned as One Focus
alter table captures
  add column if not exists one_focus_pinned_at timestamptz;

-- Track last time user opened the app (for re-entry message)
alter table profiles
  add column if not exists last_seen_at timestamptz;
