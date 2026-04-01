"use server";

import { revalidateCalendar } from "@libs/cache/calendar";
import CalendarEventService from "./service";
import type { CalendarEventPayload, CalendarEventUpdatePayload } from "./schema";

export const getCalendarEventsAction = async (orgId: string) => {
  return await CalendarEventService.getAllCalendarEvents(orgId);
};

export const getCalendarEventsByMonthAction = async (
  year: number,
  month: number,
  orgId: string,
) => {
  return await CalendarEventService.getCalendarEventsByMonth(year, month, orgId);
};

export const createCalendarEventAction = async (data: CalendarEventPayload, orgId: string) => {
  const result = await CalendarEventService.createCalendarEvent(data, orgId);
  revalidateCalendar();
  return result;
};

export const updateCalendarEventAction = async (
  id: string,
  orgId: string,
  data: CalendarEventUpdatePayload,
) => {
  const result = await CalendarEventService.updateCalendarEvent(id, orgId, data);
  revalidateCalendar();
  return result;
};

export const deleteCalendarEventAction = async (id: string, orgId: string) => {
  await CalendarEventService.deleteCalendarEvent(id, orgId);
  revalidateCalendar();
};
