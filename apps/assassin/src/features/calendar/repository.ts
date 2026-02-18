import { prisma } from "@libs/prisma/client";
import type { CalendarEventPayload, CalendarEventUpdatePayload } from "./schema";

async function getAllCalendarEvents() {
  return await prisma.calendarEvent.findMany({
    orderBy: { startDate: "asc" },
  });
}

async function getCalendarEventById(id: string) {
  return await prisma.calendarEvent.findUnique({ where: { id } });
}

async function createCalendarEvent(input: CalendarEventPayload) {
  return await prisma.calendarEvent.create({ data: input });
}

async function updateCalendarEvent(id: string, input: CalendarEventUpdatePayload) {
  return await prisma.calendarEvent.update({ where: { id }, data: input });
}

async function deleteCalendarEvent(id: string) {
  await prisma.calendarEvent.delete({ where: { id } });
}

const CalendarEventRepository = {
  getAllCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};

export default CalendarEventRepository;
