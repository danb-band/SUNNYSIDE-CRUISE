-- Migration: add_song_like
-- Creates the song_like join table, adds likeCount to song,
-- and wires up realtime, RLS policies, and a trigger to keep likeCount in sync.

BEGIN;

DO $migration$
BEGIN
  IF to_regclass('public.song') IS NULL THEN
    RAISE NOTICE 'Skipping add_song_like migration: public.song does not exist yet.';
    RETURN;
  END IF;

  IF to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE 'Skipping add_song_like migration: public.profiles does not exist yet.';
    RETURN;
  END IF;

  EXECUTE $sql$
    CREATE TABLE IF NOT EXISTS public.song_like (
      id          uuid         NOT NULL DEFAULT gen_random_uuid(),
      "songId"    uuid         NOT NULL,
      "userId"    uuid         NOT NULL,
      "createdAt" timestamptz  NOT NULL DEFAULT now(),
      CONSTRAINT song_like_pkey PRIMARY KEY (id),
      CONSTRAINT song_like_song_id_fkey
        FOREIGN KEY ("songId") REFERENCES public.song(id) ON DELETE CASCADE,
      CONSTRAINT song_like_song_id_user_id_key UNIQUE ("songId", "userId")
    )
  $sql$;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'song_like_user_id_fkey'
      AND conrelid = 'public.song_like'::regclass
  ) THEN
    EXECUTE $sql$
      ALTER TABLE public.song_like
        ADD CONSTRAINT song_like_user_id_fkey
        FOREIGN KEY ("userId") REFERENCES public.profiles(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
    $sql$;
  END IF;

  EXECUTE $sql$
    ALTER TABLE public.song
      ADD COLUMN IF NOT EXISTS "likeCount" integer NOT NULL DEFAULT 0
  $sql$;

  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relname = 'song_like'
      AND relnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE public.song_like REPLICA IDENTITY FULL$sql$;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'song_like'
    ) THEN
      EXECUTE $sql$ALTER PUBLICATION supabase_realtime ADD TABLE public.song_like$sql$;
    END IF;
  END IF;

  EXECUTE $sql$ALTER TABLE public.song_like ENABLE ROW LEVEL SECURITY$sql$;

  EXECUTE $sql$DROP POLICY IF EXISTS "Anyone can view likes" ON public.song_like$sql$;
  EXECUTE $sql$DROP POLICY IF EXISTS "Authenticated users can like songs" ON public.song_like$sql$;
  EXECUTE $sql$DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.song_like$sql$;

  EXECUTE $sql$
    CREATE POLICY "Anyone can view likes"
      ON public.song_like FOR SELECT
      USING (true)
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "Authenticated users can like songs"
      ON public.song_like FOR INSERT
      WITH CHECK (auth.uid() = "userId")
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "Users can unlike their own likes"
      ON public.song_like FOR DELETE
      USING (auth.uid() = "userId")
  $sql$;

  EXECUTE $sql$
    CREATE OR REPLACE FUNCTION public.sync_song_like_count()
    RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
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
    $fn$;
  $sql$;

  EXECUTE $sql$DROP TRIGGER IF EXISTS trg_sync_song_like_count ON public.song_like$sql$;
  EXECUTE $sql$
    CREATE TRIGGER trg_sync_song_like_count
      AFTER INSERT OR DELETE ON public.song_like
      FOR EACH ROW EXECUTE FUNCTION public.sync_song_like_count()
  $sql$;

  EXECUTE $sql$
    UPDATE public.song s
    SET "likeCount" = COALESCE((
      SELECT COUNT(*)::integer
      FROM public.song_like sl
      WHERE sl."songId" = s.id
    ), 0)
  $sql$;
END;
$migration$;

COMMIT;
