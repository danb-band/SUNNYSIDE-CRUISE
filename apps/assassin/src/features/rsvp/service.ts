import RsvpRepository from "./repository";
import { calendarEventRsvpSchema, rsvpWithProfileSchema } from "./schema";
import type { RsvpWithProfile } from "./schema";

const getAttendeesByEvent = async (eventId: string): Promise<RsvpWithProfile[]> => {
  const rsvps = await RsvpRepository.getRsvpsByEvent(eventId);
  return rsvps
    .map((r) => rsvpWithProfileSchema.safeParse(r))
    .filter((r) => r.success)
    .map((r) => r.data!);
};

const getUserRsvpStatus = async (eventId: string, userId: string): Promise<"ATTENDING" | "NOT_ATTENDING" | null> => {
  const rsvp = await RsvpRepository.getRsvpByEventAndUser(eventId, userId);
  if (!rsvp) return null;
  const parsed = calendarEventRsvpSchema.safeParse(rsvp);
  if (!parsed.success) return null;
  return parsed.data.status;
};

const toggleAttending = async (eventId: string, userId: string): Promise<{ status: "ATTENDING" | "NOT_ATTENDING" | null }> => {
  const existing = await RsvpRepository.getRsvpByEventAndUser(eventId, userId);

  if (existing?.status === "ATTENDING") {
    await RsvpRepository.deleteRsvp(eventId, userId);
    return { status: null };
  }

  await RsvpRepository.upsertRsvp(eventId, userId, "ATTENDING");
  return { status: "ATTENDING" };
};

const RsvpService = {
  getAttendeesByEvent,
  getUserRsvpStatus,
  toggleAttending,
};

export default RsvpService;
