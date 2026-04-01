import CalendarEventRepository from "./repository";
import {
  CalendarEvent,
  CalendarEventPayload,
  CalendarEventUpdatePayload,
  calendarEventSchema,
  updateCalendarEventSchema,
} from "./schema";
import { startOfMonth, endOfMonth } from "date-fns";

const getAllCalendarEvents = async (orgId: string): Promise<CalendarEvent[]> => {
  const events = await CalendarEventRepository.getAllCalendarEvents(orgId);
  const parsed = calendarEventSchema.array().safeParse(events);
  if (!parsed.success) throw new Error("Invalid calendar event responses from DB");
  return parsed.data;
};

const getCalendarEventsByMonth = async (year: number, month: number, orgId: string): Promise<CalendarEvent[]> => {
  const targetDate = new Date(year, month - 1, 1);
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  const events = await CalendarEventRepository.getCalendarEventsByDateRange(start, end, orgId);
  const parsed = calendarEventSchema.array().safeParse(events);
  if (!parsed.success) throw new Error("Invalid calendar event responses from DB");
  return parsed.data;
};

const getCalendarEventById = async (id: string, orgId: string): Promise<CalendarEvent> => {
  const event = await CalendarEventRepository.getCalendarEventById(id, orgId);
  const parsed = calendarEventSchema.safeParse(event);
  if (!parsed.success) throw new Error("Invalid calendar event response from DB");
  return parsed.data;
};

const createCalendarEvent = async (input: CalendarEventPayload, orgId: string): Promise<CalendarEvent> => {
  const result = await CalendarEventRepository.createCalendarEvent({ ...input, orgId });
  const parsed = calendarEventSchema.safeParse(result);
  if (!parsed.success) throw new Error("Invalid calendar event response from DB");
  return parsed.data;
};

const updateCalendarEvent = async (
  id: string,
  orgId: string,
  input: CalendarEventUpdatePayload,
): Promise<CalendarEvent> => {
  const existed = await getCalendarEventById(id, orgId);
  const parsedInput = updateCalendarEventSchema.safeParse(input);
  if (!parsedInput.success) throw new Error("Invalid calendar event input");
  const result = await CalendarEventRepository.updateCalendarEvent(id, orgId, {
    ...existed,
    ...parsedInput.data,
  });
  const parsed = calendarEventSchema.safeParse(result);
  if (!parsed.success) throw new Error("Invalid calendar event response from DB");
  return parsed.data;
};

const deleteCalendarEvent = async (id: string, orgId: string): Promise<void> => {
  await CalendarEventRepository.deleteCalendarEvent(id, orgId);
};

const CalendarEventService = {
  getAllCalendarEvents,
  getCalendarEventsByMonth,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};

export default CalendarEventService;
