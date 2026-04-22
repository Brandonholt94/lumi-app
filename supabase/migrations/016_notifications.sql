-- Push subscription storage (one row per user+device)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id  TEXT    NOT NULL,
  endpoint       TEXT    NOT NULL,
  p256dh         TEXT    NOT NULL,
  auth           TEXT    NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clerk_user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user
  ON push_subscriptions (clerk_user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Per-user notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  clerk_user_id   TEXT    PRIMARY KEY,
  morning_checkin BOOLEAN NOT NULL DEFAULT true,
  focus_reminder  BOOLEAN NOT NULL DEFAULT true,
  med_reminder    BOOLEAN NOT NULL DEFAULT false,
  evening_checkin BOOLEAN NOT NULL DEFAULT false,
  weekly_report   BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
