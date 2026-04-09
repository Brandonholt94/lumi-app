-- ─────────────────────────────────────────────────────────────
-- Migration 004: profiles
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- profiles: one row per user, created on onboarding completion
-- Feeds Lumi's system prompt and gates plan features

create table if not exists profiles (
  clerk_user_id           text        primary key,
  display_name            text,
  adhd_identity           text,        -- 'diagnosed' | 'self-identified' | 'exploring' | 'loved-one'
  biggest_struggle        text,        -- 'starting' | 'time' | 'overwhelm' | 'emotional' | 'forgetting' | 'all'
  hardest_time            text,        -- 'morning' | 'afternoon' | 'evening' | 'unpredictable'
  support_situation       text,        -- 'therapist' | 'medication' | 'waitlist' | 'alone'
  tone_preference         text,        -- 'warm' | 'direct' | 'balanced'
  plan                    text        not null default 'free' check (plan in ('free', 'core', 'companion')),
  onboarding_completed_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
