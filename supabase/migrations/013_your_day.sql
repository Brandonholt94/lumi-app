-- 013_your_day.sql
-- Adds time_block and notes to captures for the Your Day planner

ALTER TABLE captures
  ADD COLUMN IF NOT EXISTS time_block TEXT
    CHECK (time_block IN ('morning', 'afternoon', 'evening')),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for fast day-planner queries
CREATE INDEX IF NOT EXISTS captures_time_block_idx
  ON captures (clerk_user_id, time_block)
  WHERE time_block IS NOT NULL;
