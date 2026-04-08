-- ─────────────────────────────────────────
-- LUMI DATABASE SCHEMA
-- ─────────────────────────────────────────

-- Profiles (extends Clerk user)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'core', 'companion')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  -- Onboarding answers
  adhd_diagnosis TEXT,         -- 'diagnosed', 'self-identified', 'exploring'
  biggest_challenge TEXT,      -- 'starting', 'finishing', 'time', 'overwhelm', 'other'
  daily_goal TEXT,
  -- Usage limits
  ai_messages_today INTEGER DEFAULT 0,
  ai_messages_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages (chat history)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mood check-ins
CREATE TABLE mood_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('foggy', 'okay', 'wired', 'drained')),
  note TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT now()
);

-- Focus sessions
CREATE TABLE focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Brain dumps
CREATE TABLE brain_dumps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,  -- has Lumi processed this into tasks?
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Captures (tagged brain dump items)
CREATE TABLE captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  tag TEXT CHECK (tag IN ('task', 'idea', 'worry', 'reminder')),
  completed BOOLEAN DEFAULT false,
  addressed BOOLEAN DEFAULT false,
  priority_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crisis flags (internal safety record — never shown to user)
CREATE TABLE crisis_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('CRISIS', 'DISTRESS')),
  matched_phrase TEXT,
  message_excerpt TEXT,   -- first 200 chars only, for review
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User context (Lumi's compressed memory)
CREATE TABLE user_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  summary TEXT,                -- compressed summary Lumi builds over time
  patterns TEXT,               -- recurring themes Lumi has noticed
  wins TEXT,                   -- recent wins to reference
  blockers TEXT,               -- known blockers
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins  ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_dumps    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context   ENABLE ROW LEVEL SECURITY;
ALTER TABLE captures       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_flags   ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "own data only" ON profiles       FOR ALL USING (clerk_user_id = current_setting('app.clerk_user_id', true));
CREATE POLICY "own data only" ON messages       FOR ALL USING (clerk_user_id = current_setting('app.clerk_user_id', true));
CREATE POLICY "own data only" ON mood_checkins  FOR ALL USING (clerk_user_id = current_setting('app.clerk_user_id', true));
CREATE POLICY "own data only" ON focus_sessions FOR ALL USING (clerk_user_id = current_setting('app.clerk_user_id', true));
CREATE POLICY "own data only" ON brain_dumps    FOR ALL USING (clerk_user_id = current_setting('app.clerk_user_id', true));
CREATE POLICY "own data only" ON user_context   FOR ALL USING (clerk_user_id = current_setting('app.clerk_user_id', true));
CREATE POLICY "own data only" ON captures       FOR ALL USING (clerk_user_id = current_setting('app.clerk_user_id', true));
-- crisis_flags: service role only — no user-level access
CREATE POLICY "service only" ON crisis_flags    FOR ALL USING (false);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────

CREATE INDEX idx_messages_user       ON messages(clerk_user_id, created_at DESC);
CREATE INDEX idx_mood_user           ON mood_checkins(clerk_user_id, checked_in_at DESC);
CREATE INDEX idx_focus_user          ON focus_sessions(clerk_user_id, started_at DESC);
CREATE INDEX idx_brain_dumps_user    ON brain_dumps(clerk_user_id, created_at DESC);
CREATE INDEX idx_captures_user       ON captures(clerk_user_id, created_at DESC);
CREATE INDEX idx_captures_tag        ON captures(clerk_user_id, tag, created_at DESC);
CREATE INDEX idx_crisis_flags_user   ON crisis_flags(clerk_user_id, created_at DESC);
CREATE INDEX idx_crisis_flags_tier   ON crisis_flags(tier, created_at DESC);
