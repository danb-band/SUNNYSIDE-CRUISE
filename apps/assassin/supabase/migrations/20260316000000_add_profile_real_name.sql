-- Migration: add_profile_real_name
-- Adds real_name column to profiles table (NOT NULL).
-- Backfills existing rows with real_name = name.
-- Creates/updates trigger to inject real_name for new users.

BEGIN;

-- 1. Add real_name column as nullable first (needed for backfill)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS real_name TEXT;

-- 2. Backfill existing rows
UPDATE public.profiles SET real_name = name WHERE real_name IS NULL;

-- 3. Enforce NOT NULL
ALTER TABLE public.profiles ALTER COLUMN real_name SET NOT NULL;

-- 4. Create/replace trigger function for new user sign-ups
--    Sets both name and real_name from auth user metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, real_name)
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
