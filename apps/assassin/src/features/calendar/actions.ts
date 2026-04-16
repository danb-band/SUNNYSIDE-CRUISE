"use server";

import { revalidateCalendar } from "@libs/cache/calendar";
import { getCurrentUser } from "@libs/supabase/auth";
import CalendarEventService from "./service";
import type { CalendarEventPayload, CalendarEventUpdatePayload } from "./schema";

export const getCalendarEventsAction = async (orgId: string) => {
  const user = await getCurrentUser();
  return await CalendarEventService.getAllCalendarEvents(orgId, user.id);
};

export const getCalendarEventsByMonthAction = async (
  year: number,
  month: number,
  orgId: string,
) => {
  const user = await getCurrentUser();
  return await CalendarEventService.getCalendarEventsByMonth(year, month, orgId, user.id);
};

export const createCalendarEventAction = async (data: CalendarEventPayload, orgId: string) => {
  const user = await getCurrentUser();
  const result = await CalendarEventService.createCalendarEvent(data, orgId, user.id);
  revalidateCalendar();
  return result;
};

export const updateCalendarEventAction = async (
  id: string,
  orgId: string,
  data: CalendarEventUpdatePayload,
) => {
  const user = await getCurrentUser();
  const result = await CalendarEventService.updateCalendarEvent(id, orgId, data, user.id);
  revalidateCalendar();
  return result;
};

export const deleteCalendarEventAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  await CalendarEventService.deleteCalendarEvent(id, orgId, user.id);
  revalidateCalendar();
};
