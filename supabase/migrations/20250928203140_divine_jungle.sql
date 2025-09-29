/*
  # Remove Demo Data and Enable Live Tracking

  1. Changes
    - Remove demo user data
    - Remove demo leaderboard entries
    - Keep table structure intact for live data

  2. Security
    - Maintain all RLS policies
    - Keep all table constraints
*/

-- Remove demo data from users table
DELETE FROM users WHERE email = 'demo@example.com';

-- Remove demo data from leaderboards table
DELETE FROM leaderboards WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Reset any auto-increment sequences if they exist
-- (PostgreSQL uses sequences for auto-incrementing columns)

-- Add comment to track live data start
COMMENT ON TABLE users IS 'Live user data - demo data removed';
COMMENT ON TABLE leaderboards IS 'Live leaderboard data - demo data removed';