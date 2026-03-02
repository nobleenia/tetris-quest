-- ============================================================
-- Stackr Quest — Supabase SQL Migrations
-- Run in order in the Supabase SQL Editor or via CLI.
-- ============================================================


-- ─── 001: Profiles ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar_url   TEXT,
  total_stars  INT  NOT NULL DEFAULT 0,
  highest_world INT NOT NULL DEFAULT 1,
  highest_level INT NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow anyone to read profiles (for leaderboards)
CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT USING (true);


-- ─── 002: Player Progress (Cloud Save) ──────────────────────
CREATE TABLE IF NOT EXISTS player_progress (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id    TEXT NOT NULL,    -- e.g. '1-5'
  stars       INT  NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  best_score  INT  NOT NULL DEFAULT 0,
  best_time   REAL,            -- seconds, nullable
  retries     INT  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, level_id)
);

ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON player_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own progress"
  ON player_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON player_progress FOR UPDATE USING (auth.uid() = user_id);


-- ─── 003: Leaderboard — Per-level ───────────────────────────
--   Uses player_progress as source; this view provides ranked access.
CREATE OR REPLACE VIEW leaderboard_level AS
SELECT
  pp.level_id,
  pp.user_id,
  p.display_name,
  pp.best_score AS score,
  pp.stars,
  pp.best_time,
  ROW_NUMBER() OVER (
    PARTITION BY pp.level_id
    ORDER BY pp.best_score DESC, pp.stars DESC, pp.best_time ASC NULLS LAST
  ) AS rank
FROM player_progress pp
JOIN profiles p ON p.id = pp.user_id
WHERE pp.best_score > 0;


-- ─── 004: Leaderboard — Total Stars (global) ────────────────
CREATE OR REPLACE VIEW leaderboard_stars AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.total_stars,
  p.highest_world,
  p.highest_level,
  ROW_NUMBER() OVER (
    ORDER BY p.total_stars DESC, p.highest_world DESC, p.highest_level DESC
  ) AS rank
FROM profiles p
WHERE p.total_stars > 0;


-- ─── 005: Daily Challenge Results ────────────────────────────
CREATE TABLE IF NOT EXISTS daily_results (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  score       INT  NOT NULL DEFAULT 0,
  stars       INT  NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  lines_cleared INT NOT NULL DEFAULT 0,
  time_sec    REAL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, challenge_date)
);

ALTER TABLE daily_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all daily results"
  ON daily_results FOR SELECT USING (true);

CREATE POLICY "Users can insert own daily result"
  ON daily_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No updates — one submission per day, immutable
CREATE POLICY "No updates on daily results"
  ON daily_results FOR UPDATE USING (false);


-- ─── 006: Leaderboard — Daily Challenge ─────────────────────
CREATE OR REPLACE VIEW leaderboard_daily AS
SELECT
  dr.challenge_date,
  dr.user_id,
  p.display_name,
  dr.score,
  dr.stars,
  dr.time_sec,
  ROW_NUMBER() OVER (
    PARTITION BY dr.challenge_date
    ORDER BY dr.score DESC, dr.stars DESC, dr.time_sec ASC NULLS LAST
  ) AS rank
FROM daily_results dr
JOIN profiles p ON p.id = dr.user_id;


-- ─── 007: Friends System ────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_a      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b)  -- canonical ordering to prevent duplicates
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b);


-- ─── 008: Friend Codes ──────────────────────────────────────
-- Short shareable code for adding friends
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE;

-- Generate friend codes for existing users
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.friend_code := UPPER(SUBSTR(MD5(NEW.id::text || RANDOM()::text), 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_friend_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.friend_code IS NULL)
  EXECUTE FUNCTION generate_friend_code();


-- ─── 009: Indexes for performance ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_progress_user ON player_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_level ON player_progress(level_id);
CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_results(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_user ON daily_results(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_a ON friendships(user_a);
CREATE INDEX IF NOT EXISTS idx_friends_b ON friendships(user_b);
CREATE INDEX IF NOT EXISTS idx_profiles_stars ON profiles(total_stars DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_code ON profiles(friend_code);


-- ─── 010: Updated-at trigger ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_updated_at_progress
  BEFORE UPDATE ON player_progress
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
