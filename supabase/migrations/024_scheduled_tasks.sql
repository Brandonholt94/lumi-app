-- Add scheduled_at to captures so tasks can appear on the day timeline
ALTER TABLE captures ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

CREATE INDEX IF NOT EXISTS captures_scheduled_at_idx ON captures (clerk_user_id, scheduled_at);
