-- Migration: add_song_like
-- Creates the song_like join table, adds likeCount to song,
-- and wires up realtime, RLS policies, and a trigger to keep likeCount in sync.

BEGIN;

-- 1. song_like table
CREATE TABLE IF NOT EXISTS public.song_like (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  "songId"   uuid        NOT NULL,
  "userId"   uuid        NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT song_like_pkey PRIMARY KEY (id),
  CONSTRAINT song_like_song_id_fkey
    FOREIGN KEY ("songId") REFERENCES public.song(id) ON DELETE CASCADE,
  CONSTRAINT song_like_song_id_user_id_key UNIQUE ("songId", "userId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'song_like_user_id_fkey'
      AND conrelid = 'public.song_like'::regclass
  ) THEN
    ALTER TABLE public.song_like
      ADD CONSTRAINT song_like_user_id_fkey
      FOREIGN KEY ("userId") REFERENCES public.profiles(id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

-- 2. likeCount column on song
ALTER TABLE public.song
  ADD COLUMN IF NOT EXISTS "likeCount" integer NOT NULL DEFAULT 0;

-- 3. Realtime
ALTER TABLE public.song_like REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.song_like;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 4. RLS
ALTER TABLE public.song_like ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes"               ON public.song_like;
DROP POLICY IF EXISTS "Authenticated users can like songs"  ON public.song_like;
DROP POLICY IF EXISTS "Users can unlike their own likes"    ON public.song_like;

CREATE POLICY "Anyone can view likes"
  ON public.song_like FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like songs"
  ON public.song_like FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can unlike their own likes"
  ON public.song_like FOR DELETE
  USING (auth.uid() = "userId");

-- 5. likeCount sync trigger
CREATE OR REPLACE FUNCTION public.sync_song_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.song
    SET "likeCount" = "likeCount" + 1
    WHERE id = NEW."songId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.song
    SET "likeCount" = GREATEST(0, "likeCount" - 1)
    WHERE id = OLD."songId";
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_song_like_count ON public.song_like;
CREATE TRIGGER trg_sync_song_like_count
  AFTER INSERT OR DELETE ON public.song_like
  FOR EACH ROW EXECUTE FUNCTION public.sync_song_like_count();

-- 6. backfill likeCount for existing rows
UPDATE public.song s
SET "likeCount" = COALESCE((
  SELECT COUNT(*)::integer
  FROM public.song_like sl
  WHERE sl."songId" = s.id
), 0);

COMMIT;
