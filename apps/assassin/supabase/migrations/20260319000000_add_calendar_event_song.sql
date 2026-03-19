-- Migration: add_calendar_event_song

BEGIN;

CREATE TABLE IF NOT EXISTS public.calendar_event_song (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  "eventId"   uuid        NOT NULL,
  "songId"    uuid        NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_event_song_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_event_song_event_id_fkey
    FOREIGN KEY ("eventId") REFERENCES public.calendar_event(id)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT calendar_event_song_song_id_fkey
    FOREIGN KEY ("songId") REFERENCES public.song(id)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT calendar_event_song_event_id_song_id_key UNIQUE ("eventId", "songId")
);

CREATE INDEX IF NOT EXISTS "calendar_event_song_eventId_idx" ON public.calendar_event_song("eventId");
CREATE INDEX IF NOT EXISTS "calendar_event_song_songId_idx" ON public.calendar_event_song("songId");

ALTER TABLE public.calendar_event_song ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view event songs" ON public.calendar_event_song;
DROP POLICY IF EXISTS "Authenticated users can insert event songs" ON public.calendar_event_song;
DROP POLICY IF EXISTS "Authenticated users can delete event songs" ON public.calendar_event_song;

CREATE POLICY "Authenticated users can view event songs"
  ON public.calendar_event_song FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert event songs"
  ON public.calendar_event_song FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete event songs"
  ON public.calendar_event_song FOR DELETE
  USING (auth.role() = 'authenticated');

COMMIT;
