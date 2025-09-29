/*
  # Add missing columns to achievements table

  1. New Columns
    - `title` (text, required) - Achievement title/name
    - `description` (text, required) - Achievement description
    - `icon` (text, required) - Icon identifier for the achievement
    - `tier` (text, required) - Achievement tier (bronze, silver, gold, platinum)
    - `rewards` (jsonb) - Reward details (coins, gems, tools, etc.)

  2. Updates
    - Add missing columns to existing achievements table
    - Set appropriate constraints and defaults
*/

-- Add missing columns to achievements table
ALTER TABLE achievements 
ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Achievement',
ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT 'Complete this achievement to earn rewards',
ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT 'trophy',
ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
ADD COLUMN IF NOT EXISTS rewards jsonb DEFAULT '{}'::jsonb;

-- Remove default constraints after adding columns (for future inserts)
ALTER TABLE achievements ALTER COLUMN title DROP DEFAULT;
ALTER TABLE achievements ALTER COLUMN description DROP DEFAULT;
ALTER TABLE achievements ALTER COLUMN icon DROP DEFAULT;
ALTER TABLE achievements ALTER COLUMN tier DROP DEFAULT;