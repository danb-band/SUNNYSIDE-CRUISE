-- Step 1: Add userId column (nullable first for backfill)
ALTER TABLE player ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Step 2: Backfill userId from profiles where name matches realName (only if name column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player' AND column_name = 'name'
  ) THEN
    UPDATE player SET user_id = profiles.id
    FROM profiles
    WHERE player.name = profiles."realName";
  END IF;
END $$;

-- Step 3: Delete player rows with no matching user (can't be backfilled), then make NOT NULL
DELETE FROM player WHERE user_id IS NULL;
ALTER TABLE player ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Drop name column (if still exists)
ALTER TABLE player DROP COLUMN IF EXISTS name;
