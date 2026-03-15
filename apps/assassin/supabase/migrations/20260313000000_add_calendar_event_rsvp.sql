-- Create RsvpStatus enum
CREATE TYPE "RsvpStatus" AS ENUM ('ATTENDING', 'NOT_ATTENDING');

-- Create calendar_event_rsvp table
CREATE TABLE "calendar_event_rsvp" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "status" "RsvpStatus" NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT "calendar_event_rsvp_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "calendar_event_rsvp_eventId_userId_key" UNIQUE ("eventId", "userId"),
  CONSTRAINT "calendar_event_rsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_event"("id") ON DELETE CASCADE,
  CONSTRAINT "calendar_event_rsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create indexes
CREATE INDEX "calendar_event_rsvp_eventId_idx" ON "calendar_event_rsvp"("eventId");
CREATE INDEX "calendar_event_rsvp_userId_idx" ON "calendar_event_rsvp"("userId");

-- Enable RLS
ALTER TABLE "calendar_event_rsvp" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all RSVPs" ON "calendar_event_rsvp"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own RSVP" ON "calendar_event_rsvp"
  FOR ALL USING (auth.uid() = "userId");
