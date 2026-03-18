-- Step 1: Add userId column (nullable first for backfill)
ALTER TABLE player ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Step 2: Backfill userId from profiles where name matches realName
UPDATE player SET user_id = profiles.id
FROM profiles
WHERE player.name = profiles."realName";

-- Step 3: Make userId NOT NULL
ALTER TABLE player ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Drop name column
ALTER TABLE player DROP COLUMN name;
