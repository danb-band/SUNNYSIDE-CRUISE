import { assertOrgMember } from "@features/org/service";
import RsvpRepository from "./repository";
import { calendarEventRsvpSchema, rsvpWithProfileSchema } from "./schema";
import type { RsvpWithProfile } from "./schema";

const getAttendeesByEvent = async (
  eventId: string,
  orgId: string,
  userId: string,
): Promise<RsvpWithProfile[]> => {
  await assertOrgMember(userId, orgId);
  const rsvps = await RsvpRepository.getRsvpsByEvent(eventId, orgId);
  return rsvps
    .map((r) => rsvpWithProfileSchema.safeParse(r))
    .filter((r) => r.success)
    .map((r) => r.data!);
};

const getUserRsvpStatus = async (
  eventId: string,
  orgId: string,
  userId: string,
): Promise<"ATTENDING" | "NOT_ATTENDING" | null> => {
  await assertOrgMember(userId, orgId);
  const rsvp = await RsvpRepository.getRsvpByEventAndUser(eventId, userId, orgId);
  if (!rsvp) return null;
  const parsed = calendarEventRsvpSchema.safeParse(rsvp);
  if (!parsed.success) return null;
  return parsed.data.status;
};

const toggleAttending = async (
  eventId: string,
  orgId: string,
  userId: string,
): Promise<{ status: "ATTENDING" | "NOT_ATTENDING" | null }> => {
  await assertOrgMember(userId, orgId);
  const existing = await RsvpRepository.getRsvpByEventAndUser(eventId, userId, orgId);

  if (existing?.status === "ATTENDING") {
    await RsvpRepository.deleteRsvp(eventId, userId, orgId);
    return { status: null };
  }

  await RsvpRepository.upsertRsvp(eventId, userId, "ATTENDING", orgId);
  return { status: "ATTENDING" };
};

const RsvpService = {
  getAttendeesByEvent,
  getUserRsvpStatus,
  toggleAttending,
};

export default RsvpService;
