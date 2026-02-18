"use server";

import { revalidateCalendar } from "@libs/cache/calendar";
import CalendarEventService from "./service";
import type { CalendarEventPayload, CalendarEventUpdatePayload } from "./schema";

export const getCalendarEventsAction = async () => {
  return await CalendarEventService.getAllCalendarEvents();
};

export const createCalendarEventAction = async (data: CalendarEventPayload) => {
  const result = await CalendarEventService.createCalendarEvent(data);
  revalidateCalendar();
  return result;
};

export const updateCalendarEventAction = async (id: string, data: CalendarEventUpdatePayload) => {
  const result = await CalendarEventService.updateCalendarEvent(id, data);
  revalidateCalendar();
  return result;
};

export const deleteCalendarEventAction = async (id: string) => {
  await CalendarEventService.deleteCalendarEvent(id);
  revalidateCalendar();
};
