import * as z from "zod";

export const rsvpStatusSchema = z.enum(["ATTENDING", "NOT_ATTENDING"]);
export type RsvpStatus = z.infer<typeof rsvpStatusSchema>;

export const calendarEventRsvpSchema = z.object({
  id: z.uuid(),
  eventId: z.uuid(),
  userId: z.uuid(),
  status: rsvpStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CalendarEventRsvp = z.infer<typeof calendarEventRsvpSchema>;

export const rsvpWithProfileSchema = calendarEventRsvpSchema.extend({
  profile: z.object({
    id: z.uuid(),
    name: z.string(),
  }),
});

export type RsvpWithProfile = z.infer<typeof rsvpWithProfileSchema>;
