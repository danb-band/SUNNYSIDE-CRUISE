import { prisma } from "@libs/prisma/client";

async function getEventOrgId(eventId: string): Promise<string | null> {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId },
    select: { orgId: true },
  });
  return event?.orgId ?? null;
}

async function getRsvpsByEvent(eventId: string) {
  return prisma.calendarEventRsvp.findMany({
    where: { eventId, status: "ATTENDING" },
    include: { profile: { select: { id: true, name: true, realName: true } } },
    orderBy: { createdAt: "asc" },
  });
}

async function getRsvpByEventAndUser(eventId: string, userId: string) {
  return prisma.calendarEventRsvp.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
}

async function upsertRsvp(eventId: string, userId: string, status: "ATTENDING" | "NOT_ATTENDING") {
  return prisma.calendarEventRsvp.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status },
    update: { status, updatedAt: new Date() },
  });
}

async function deleteRsvp(eventId: string, userId: string) {
  return prisma.calendarEventRsvp.delete({
    where: { eventId_userId: { eventId, userId } },
  });
}

const RsvpRepository = {
  getEventOrgId,
  getRsvpsByEvent,
  getRsvpByEventAndUser,
  upsertRsvp,
  deleteRsvp,
};

export default RsvpRepository;
