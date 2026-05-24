import CalendarEventRepository from "./repository";
import { assertOrgMember } from "@features/org/service";
import {
  CalendarEvent,
  CalendarEventPayload,
  CalendarEventUpdatePayload,
  calendarEventSchema,
  updateCalendarEventSchema,
} from "./schema";
import { startOfMonth, endOfMonth } from "date-fns";
import { TransactionClient } from "@/libs/prisma/types";

const getAllCalendarEvents = async (orgId: string, userId: string): Promise<CalendarEvent[]> => {
  await assertOrgMember(userId, orgId);
  const events = await CalendarEventRepository.getAllCalendarEvents(orgId);
  const parsed = calendarEventSchema.array().safeParse(events);
  if (!parsed.success) throw new Error("Invalid calendar event responses from DB");
  return parsed.data;
};

const getCalendarEventsByMonth = async (
  year: number,
  month: number,
  orgId: string,
  userId: string,
): Promise<CalendarEvent[]> => {
  await assertOrgMember(userId, orgId);
  const targetDate = new Date(year, month - 1, 1);
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  const events = await CalendarEventRepository.getCalendarEventsByDateRange(start, end, orgId);
  const parsed = calendarEventSchema.array().safeParse(events);
  if (!parsed.success) throw new Error("Invalid calendar event responses from DB");
  return parsed.data;
};

const getCalendarEventById = async (
  id: string,
  orgId: string,
  userId: string,
): Promise<CalendarEvent> => {
  await assertOrgMember(userId, orgId);
  const event = await CalendarEventRepository.getCalendarEventById(id, orgId);
  const parsed = calendarEventSchema.safeParse(event);
  if (!parsed.success) throw new Error("Invalid calendar event response from DB");
  return parsed.data;
};

const createCalendarEvent = async (
  input: CalendarEventPayload,
  orgId: string,
  userId: string,
): Promise<CalendarEvent> => {
  await assertOrgMember(userId, orgId);
  const result = await CalendarEventRepository.createCalendarEvent({ ...input, orgId });
  const parsed = calendarEventSchema.safeParse(result);
  if (!parsed.success) throw new Error("Invalid calendar event response from DB");
  return parsed.data;
};

const updateCalendarEvent = async (
  id: string,
  orgId: string,
  input: CalendarEventUpdatePayload,
  userId: string,
): Promise<CalendarEvent> => {
  await assertOrgMember(userId, orgId);

  const parsedInput = updateCalendarEventSchema.safeParse(input);
  if (!parsedInput.success) throw new Error("Invalid calendar event input");

  const result = await CalendarEventRepository.updateCalendarEvent(id, orgId, parsedInput.data);
  const parsed = calendarEventSchema.safeParse(result);
  if (!parsed.success) throw new Error("Invalid calendar event response from DB");

  return parsed.data;
};

const hardDeleteCalendarEvent = async (
  id: string,
  orgId: string,
  userId: string,
): Promise<void> => {
  await assertOrgMember(userId, orgId);
  await CalendarEventRepository.hardDeleteCalendarEvent(id, orgId);
};

const hardDeleteCalendarEventsByOrgId = async (orgId: string, tx?: TransactionClient) => {
  await CalendarEventRepository.hardDeleteCalendarEventsByOrgId(orgId, tx);
};

const CalendarEventService = {
  getAllCalendarEvents,
  getCalendarEventsByMonth,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  hardDeleteCalendarEvent,
  hardDeleteCalendarEventsByOrgId,
};

export default CalendarEventService;
