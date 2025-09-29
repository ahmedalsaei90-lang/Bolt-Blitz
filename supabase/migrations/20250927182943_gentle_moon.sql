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
    - Set default values for existing records
*/

-- Add missing columns to achievements table
DO $$
BEGIN
  -- Add title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievements' AND column_name = 'title'
  ) THEN
    ALTER TABLE achievements ADD COLUMN title text NOT NULL DEFAULT 'Achievement';
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievements' AND column_name = 'description'
  ) THEN
    ALTER TABLE achievements ADD COLUMN description text NOT NULL DEFAULT 'Complete this achievement to earn rewards';
  END IF;

  -- Add icon column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievements' AND column_name = 'icon'
  ) THEN
    ALTER TABLE achievements ADD COLUMN icon text NOT NULL DEFAULT 'trophy';
  END IF;

  -- Add tier column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievements' AND column_name = 'tier'
  ) THEN
    ALTER TABLE achievements ADD COLUMN tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'));
  END IF;

  -- Add rewards column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievements' AND column_name = 'rewards'
  ) THEN
    ALTER TABLE achievements ADD COLUMN rewards jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Remove default constraints after adding columns
ALTER TABLE achievements ALTER COLUMN title DROP DEFAULT;
ALTER TABLE achievements ALTER COLUMN description DROP DEFAULT;
ALTER TABLE achievements ALTER COLUMN icon DROP DEFAULT;
ALTER TABLE achievements ALTER COLUMN tier DROP DEFAULT;