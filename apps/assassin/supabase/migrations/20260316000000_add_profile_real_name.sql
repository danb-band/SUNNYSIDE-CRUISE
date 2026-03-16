-- Migration: add_profile_realName
-- Adds "realName" column to profiles table (NOT NULL).
-- Backfills existing rows with "realName" = name.
-- Creates/updates trigger to inject "realName" for new users.

BEGIN;

-- 1. Add "realName" column as nullable first (needed for backfill)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "realName" TEXT;

-- 2. Backfill existing rows
UPDATE public.profiles SET "realName" = name WHERE "realName" IS NULL;

-- 3. Enforce NOT NULL
ALTER TABLE public.profiles ALTER COLUMN "realName" SET NOT NULL;

-- 4. Create/replace trigger function for new user sign-ups
--    Sets both name and "realName" from auth user metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, "realName")
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
