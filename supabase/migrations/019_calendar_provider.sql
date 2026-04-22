-- Add provider column to calendar_tokens so we can store
-- Google and Microsoft tokens for the same user.

ALTER TABLE calendar_tokens
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'google';

-- Drop existing single-column PK and replace with composite PK
ALTER TABLE calendar_tokens DROP CONSTRAINT IF EXISTS calendar_tokens_pkey;
ALTER TABLE calendar_tokens ADD PRIMARY KEY (clerk_user_id, provider);
