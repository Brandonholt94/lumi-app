-- Google Calendar OAuth token storage
CREATE TABLE IF NOT EXISTS calendar_tokens (
  clerk_user_id  TEXT        PRIMARY KEY,
  access_token   TEXT        NOT NULL,
  refresh_token  TEXT        NOT NULL,
  token_expiry   TIMESTAMPTZ NOT NULL,
  google_email   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;
