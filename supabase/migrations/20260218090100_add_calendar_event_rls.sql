-- Migration: add_calendar_event_rls
-- Creates the calendar_event table (if not exists) and enables RLS with access policies.
-- Table DDL mirrors the Prisma schema; safe to run on origin before prisma db push.

BEGIN;

-- 1. Table
CREATE TABLE IF NOT EXISTS public.calendar_event (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  location    text        NOT NULL,
  "startDate" timestamptz NOT NULL,
  "endDate"   timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_event_pkey PRIMARY KEY (id)
);

-- 2. Realtime
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relname = 'calendar_event'
      AND relnamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE public.calendar_event REPLICA IDENTITY FULL;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'calendar_event'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_event;
    END IF;
  END IF;
END $$;

-- 3. RLS
ALTER TABLE public.calendar_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view calendar events"       ON public.calendar_event;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.calendar_event;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.calendar_event;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.calendar_event;

CREATE POLICY "Anyone can view calendar events"
  ON public.calendar_event FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.calendar_event FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update events"
  ON public.calendar_event FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete events"
  ON public.calendar_event FOR DELETE
  USING (auth.role() = 'authenticated');

COMMIT;
