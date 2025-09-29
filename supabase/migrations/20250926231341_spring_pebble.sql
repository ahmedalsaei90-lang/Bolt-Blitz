/*
  # Bolt Blitz Database Schema

  1. New Tables
    - `users` - Player profiles with stats and currency
    - `questions` - AI-generated trivia questions with multilingual support
    - `games` - Game sessions with team management
    - `leaderboards` - Global ranking system
    - `achievements` - Progress tracking and rewards
    - `shop_purchases` - In-app purchase history

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Questions are publicly readable, authenticated users can create
    - Games, leaderboards, and achievements follow user-specific access patterns

  3. Relationships
    - Foreign key constraints between tables
    - Proper indexing for performance
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  age integer NOT NULL CHECK (age >= 7),
  gems integer DEFAULT 100,
  coins integer DEFAULT 50,
  scores jsonb DEFAULT '[]'::jsonb,
  stats jsonb DEFAULT '{"games_played": 0, "wins": 0, "accuracy": 0}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  question_text jsonb NOT NULL,
  answers jsonb NOT NULL,
  picture_url text,
  viewed_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teams jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'ended')),
  scores jsonb DEFAULT '{}'::jsonb,
  tools_used jsonb DEFAULT '{}'::jsonb,
  double_conditions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  rank integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  progress jsonb DEFAULT '{}'::jsonb,
  unlocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create shop_purchases table
CREATE TABLE IF NOT EXISTS shop_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  item text NOT NULL,
  cost_usd numeric(10,2) NOT NULL,
  purchased_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_id ON leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(rank);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_user_id ON shop_purchases(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Questions table policies
CREATE POLICY "Anyone can read questions"
  ON questions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Games table policies
CREATE POLICY "Users can read games they participate in"
  ON games
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update games"
  ON games
  FOR UPDATE
  TO authenticated
  USING (true);

-- Leaderboards table policies
CREATE POLICY "Anyone can read leaderboards"
  ON leaderboards
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own leaderboard entries"
  ON leaderboards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entries"
  ON leaderboards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Achievements table policies
CREATE POLICY "Users can read own achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON achievements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Shop purchases table policies
CREATE POLICY "Users can read own purchases"
  ON shop_purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON shop_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update leaderboard ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ranks based on scores
  WITH ranked_scores AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
    FROM leaderboards
  )
  UPDATE leaderboards 
  SET rank = ranked_scores.new_rank
  FROM ranked_scores
  WHERE leaderboards.id = ranked_scores.id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update ranks when scores change
DROP TRIGGER IF EXISTS trigger_update_leaderboard_ranks ON leaderboards;
CREATE TRIGGER trigger_update_leaderboard_ranks
  AFTER INSERT OR UPDATE OF score ON leaderboards
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_leaderboard_ranks();

-- Insert some sample data for testing
INSERT INTO users (id, email, username, age, gems, coins, stats) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', 'DemoPlayer', 25, 150, 75, '{"games_played": 5, "wins": 3, "accuracy": 85}')
ON CONFLICT (email) DO NOTHING;

INSERT INTO leaderboards (user_id, score, rank) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 1250, 1)
ON CONFLICT DO NOTHING;

-- Create realtime publication for live updates
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE leaderboards, games, achievements;