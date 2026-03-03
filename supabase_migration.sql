-- 1v1Me Recruitment Dashboard — Full Schema Migration
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. PROFILES (auth-linked user accounts)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'scout' CHECK (role IN ('owner','manager','scout','viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. GAMES (dynamic game list with custom stat fields)
-- ============================================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL,
  icon_url TEXT,
  stat_fields JSONB NOT NULL DEFAULT '[]',
  role_options JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read games"
  ON games FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers+ can manage games"
  ON games FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager'))
  );

-- ============================================================
-- 3. PLAYERS (roster + prospects in one table)
-- ============================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ign TEXT NOT NULL,
  real_name TEXT,
  avatar_url TEXT,
  category TEXT NOT NULL DEFAULT 'prospect' CHECK (category IN ('roster','prospect')),
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  platform TEXT CHECK (platform IN ('PC','Console','Mobile')),
  role TEXT,
  region TEXT,
  age INTEGER,
  country TEXT,
  current_org TEXT,
  has_contract BOOLEAN DEFAULT false,
  contract_expiry DATE,
  tier INTEGER CHECK (tier IN (1, 2, 3)),
  player_status TEXT DEFAULT 'active' CHECK (player_status IN ('active','inactive','free_agent','signed','benched')),
  recruitment_status TEXT DEFAULT 'watching' CHECK (recruitment_status IN ('watching','contacted','in_talks','offer_sent','signed','passed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  twitter_url TEXT,
  twitter_followers INTEGER,
  twitch_url TEXT,
  twitch_followers INTEGER,
  youtube_url TEXT,
  youtube_followers INTEGER,
  tiktok_url TEXT,
  tiktok_followers INTEGER,
  discord_tag TEXT,
  competitive_history TEXT,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read players"
  ON players FOR SELECT TO authenticated USING (true);

CREATE POLICY "Scouts+ can insert players"
  ON players FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','scout'))
  );

CREATE POLICY "Scouts+ can update players"
  ON players FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','scout'))
  );

CREATE POLICY "Managers+ can delete players"
  ON players FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager'))
  );

CREATE INDEX idx_players_category ON players(category);
CREATE INDEX idx_players_game ON players(game_id);
CREATE INDEX idx_players_tier ON players(tier);
CREATE INDEX idx_players_recruitment ON players(recruitment_status);
CREATE INDEX idx_players_priority ON players(priority);

-- ============================================================
-- 4. PLAYER_STATS (game-specific flexible stats)
-- ============================================================
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  stats JSONB NOT NULL DEFAULT '{}',
  season TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, game_id, season)
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stats"
  ON player_stats FOR SELECT TO authenticated USING (true);

CREATE POLICY "Scouts+ can manage stats"
  ON player_stats FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','scout'))
  );

-- ============================================================
-- 5. COMPETITIVE_HISTORY (structured tournament results)
-- ============================================================
CREATE TABLE competitive_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tournament_name TEXT NOT NULL,
  placement TEXT,
  date DATE,
  prize_pool TEXT,
  team_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE competitive_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comp history"
  ON competitive_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Scouts+ can manage comp history"
  ON competitive_history FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','scout'))
  );

-- ============================================================
-- 6. PLAYER_NOTES (scout observations)
-- ============================================================
CREATE TABLE player_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read notes"
  ON player_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Scouts+ can insert notes"
  ON player_notes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','scout'))
  );

CREATE POLICY "Authors can update own notes"
  ON player_notes FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "Authors + managers can delete notes"
  ON player_notes FOR DELETE TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager'))
  );

-- ============================================================
-- 7. TAGS + PLAYER_TAGS (custom categorization)
-- ============================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#00f0ff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tags"
  ON tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Scouts+ can manage tags"
  ON tags FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','scout'))
  );

CREATE TABLE player_tags (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (player_id, tag_id)
);

ALTER TABLE player_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read player_tags"
  ON player_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Scouts+ can manage player_tags"
  ON player_tags FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','scout'))
  );

-- ============================================================
-- 8. ACTIVITY_LOG (audit trail)
-- ============================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read activity_log"
  ON activity_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert activity_log"
  ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- ============================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON player_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10. SEED: DEFAULT GAMES
-- ============================================================
INSERT INTO games (name, short_name, stat_fields, role_options) VALUES
(
  'Valorant', 'VAL',
  '[{"key":"rating","label":"Rating","type":"number"},{"key":"acs","label":"ACS","type":"number"},{"key":"kd_ratio","label":"K/D Ratio","type":"number"},{"key":"headshot_pct","label":"Headshot %","type":"percentage"},{"key":"first_kills","label":"First Kills/Round","type":"number"},{"key":"clutch_pct","label":"Clutch %","type":"percentage"},{"key":"rank","label":"Rank","type":"rank"}]',
  '["Duelist","Initiator","Controller","Sentinel","Flex"]'
),
(
  'League of Legends', 'LOL',
  '[{"key":"lp","label":"LP","type":"number"},{"key":"win_rate","label":"Win Rate","type":"percentage"},{"key":"kda","label":"KDA","type":"number"},{"key":"cs_per_min","label":"CS/Min","type":"number"},{"key":"vision_score","label":"Vision Score","type":"number"},{"key":"rank","label":"Rank","type":"rank"}]',
  '["Top","Jungle","Mid","ADC","Support","Fill"]'
),
(
  'CS2', 'CS2',
  '[{"key":"rating","label":"HLTV Rating","type":"number"},{"key":"adr","label":"ADR","type":"number"},{"key":"kd_ratio","label":"K/D Ratio","type":"number"},{"key":"headshot_pct","label":"Headshot %","type":"percentage"},{"key":"opening_kills","label":"Opening Kills/Round","type":"number"},{"key":"clutch_pct","label":"Clutch %","type":"percentage"},{"key":"rank","label":"Rank","type":"rank"}]',
  '["Rifler","AWPer","Entry","Lurker","IGL","Support"]'
),
(
  'Fortnite', 'FN',
  '[{"key":"pr","label":"PR Points","type":"number"},{"key":"earnings","label":"Earnings ($)","type":"number"},{"key":"win_rate","label":"Win Rate","type":"percentage"},{"key":"kd_ratio","label":"K/D Ratio","type":"number"},{"key":"avg_placement","label":"Avg Placement","type":"number"},{"key":"builds_per_min","label":"Builds/Min","type":"number"}]',
  '["Solo","Duo","Trio","Squad","IGL","Fragger","Support"]'
),
(
  'Rocket League', 'RL',
  '[{"key":"mmr","label":"MMR","type":"number"},{"key":"goals_per_game","label":"Goals/Game","type":"number"},{"key":"assists_per_game","label":"Assists/Game","type":"number"},{"key":"saves_per_game","label":"Saves/Game","type":"number"},{"key":"shooting_pct","label":"Shooting %","type":"percentage"},{"key":"rank","label":"Rank","type":"rank"}]',
  '["Striker","Midfield","Defender","Flex"]'
),
(
  'Call of Duty', 'COD',
  '[{"key":"kd_ratio","label":"K/D Ratio","type":"number"},{"key":"spm","label":"Score/Min","type":"number"},{"key":"accuracy","label":"Accuracy %","type":"percentage"},{"key":"win_rate","label":"Win Rate","type":"percentage"},{"key":"hardpoint_time","label":"HP Time (s)","type":"number"},{"key":"snd_first_bloods","label":"SnD First Bloods","type":"number"}]',
  '["Slayer","OBJ","Flex","AR","SMG"]'
),
(
  'Apex Legends', 'APEX',
  '[{"key":"damage_per_game","label":"Damage/Game","type":"number"},{"key":"kd_ratio","label":"K/D Ratio","type":"number"},{"key":"win_rate","label":"Win Rate","type":"percentage"},{"key":"headshot_pct","label":"Headshot %","type":"percentage"},{"key":"avg_placement","label":"Avg Placement","type":"number"},{"key":"rank","label":"Rank","type":"rank"}]',
  '["IGL","Fragger","Support","Flex"]'
);
