import { prisma } from "@libs/prisma/client";
import type { CalendarEventPayload, CalendarEventUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getAllCalendarEvents(orgId: string) {
  return await prisma.calendarEvent.findMany({
    where: { orgId },
    orderBy: { startDate: "asc" },
  });
}

async function getCalendarEventsByDateRange(startDate: Date, endDate: Date, orgId: string) {
  return await prisma.calendarEvent.findMany({
    where: {
      orgId,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    orderBy: { startDate: "asc" },
  });
}

async function getCalendarEventById(id: string, orgId: string) {
  return await prisma.calendarEvent.findFirst({ where: { id, orgId } });
}

async function createCalendarEvent(input: CalendarEventPayload & { orgId: string }) {
  return await prisma.calendarEvent.create({ data: input });
}

async function updateCalendarEvent(id: string, orgId: string, input: CalendarEventUpdatePayload) {
  const existing = await prisma.calendarEvent.findFirst({ where: { id, orgId } });
  if (!existing) {
    throw new Error(`CalendarEvent with ID ${id} not found in this org.`);
  }
  return await prisma.calendarEvent.update({ where: { id }, data: input });
}

async function hardDeleteCalendarEvent(id: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  const existing = await prismaClient.calendarEvent.findFirst({ where: { id, orgId } });
  if (!existing) {
    throw new Error(`CalendarEvent with ID ${id} not found in this org.`);
  }
  await prismaClient.calendarEvent.delete({ where: { id } });
}

async function hardDeleteCalendarEventsByOrgId(orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.calendarEvent.deleteMany({
    where: { orgId },
  });
}

const CalendarEventRepository = {
  getAllCalendarEvents,
  getCalendarEventsByDateRange,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  hardDeleteCalendarEvent,
  hardDeleteCalendarEventsByOrgId,
};

export default CalendarEventRepository;
