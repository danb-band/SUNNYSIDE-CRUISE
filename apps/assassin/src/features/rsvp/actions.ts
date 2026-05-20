"use server";

import { revalidateCalendar } from "@libs/cache/calendar";
import { getCurrentUser } from "@libs/supabase/auth";
import RsvpService from "./service";
import type { RsvpWithProfile } from "./schema";

export const getRsvpAttendeesAction = async (
  eventId: string,
  orgId: string,
): Promise<RsvpWithProfile[]> => {
  const user = await getCurrentUser();
  return RsvpService.getAttendeesByEvent(eventId, orgId, user.id);
};

export const getUserRsvpStatusAction = async (
  eventId: string,
  orgId: string,
): Promise<"ATTENDING" | "NOT_ATTENDING" | null> => {
  const user = await getCurrentUser();
  return RsvpService.getUserRsvpStatus(eventId, orgId, user.id);
};

export const toggleRsvpAction = async (
  eventId: string,
  orgId: string,
): Promise<{ status: "ATTENDING" | "NOT_ATTENDING" | null }> => {
  const user = await getCurrentUser();
  const result = await RsvpService.toggleAttending(eventId, orgId, user.id);
  revalidateCalendar(orgId);
  return result;
};
