-- Adds a flag that lets Lumi soften the next day after a stretch of late nights.
-- Set when the user accepts the SleepInsightCard offer ("Yes please, dim things tomorrow").
-- Read by /api/focus + /api/chat to adjust task picks and tone.
-- Self-expiring: no cron needed, just compare to NOW().
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS low_battery_mode_until TIMESTAMPTZ;

-- Optional index — tiny table, not strictly necessary, but cheap and future-proofs queries
CREATE INDEX IF NOT EXISTS idx_profiles_low_battery
  ON profiles (clerk_user_id, low_battery_mode_until)
  WHERE low_battery_mode_until IS NOT NULL;
