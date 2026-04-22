-- Track per-user daily feature usage for plan gating
-- Used for: breakdown limit (Starter: 3/day), extensible for future limits

CREATE TABLE IF NOT EXISTS daily_usage (
  clerk_user_id  TEXT    NOT NULL,
  date           DATE    NOT NULL DEFAULT CURRENT_DATE,
  breakdowns     INT     NOT NULL DEFAULT 0,
  PRIMARY KEY (clerk_user_id, date)
);

-- Index for fast lookups on (user, date)
CREATE INDEX IF NOT EXISTS daily_usage_user_date
  ON daily_usage (clerk_user_id, date);

-- RLS: users can only touch their own rows (service role bypasses this)
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
