-- Add timezone column to profiles
-- Populated automatically on first app load via /api/profile/timezone
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/New_York';
