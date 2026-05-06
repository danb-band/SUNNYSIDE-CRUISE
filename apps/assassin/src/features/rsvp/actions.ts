"use server";

import { revalidateCalendar } from "@libs/cache/calendar";
import { getCurrentUser } from "@libs/supabase/auth";
import RsvpService from "./service";
import RsvpRepository from "./repository";
import type { RsvpWithProfile } from "./schema";

export const getRsvpAttendeesAction = async (eventId: string): Promise<RsvpWithProfile[]> => {
  const user = await getCurrentUser();
  return RsvpService.getAttendeesByEvent(eventId, user.id);
};

export const getUserRsvpStatusAction = async (
  eventId: string,
): Promise<"ATTENDING" | "NOT_ATTENDING" | null> => {
  const user = await getCurrentUser();
  return RsvpService.getUserRsvpStatus(eventId, user.id);
};

export const toggleRsvpAction = async (
  eventId: string,
): Promise<{ status: "ATTENDING" | "NOT_ATTENDING" | null }> => {
  const user = await getCurrentUser();
  const result = await RsvpService.toggleAttending(eventId, user.id);
  const orgId = await RsvpRepository.getEventOrgId(eventId);
  if (!orgId) {
    throw new Error("CalendarEvent not found");
  }
  revalidateCalendar(orgId);
  return result;
};
