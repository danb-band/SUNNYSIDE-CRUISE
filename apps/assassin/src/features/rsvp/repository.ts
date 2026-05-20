import { prisma } from "@libs/prisma/client";

async function getRsvpsByEvent(eventId: string, orgId: string) {
  return prisma.calendarEventRsvp.findMany({
    where: { eventId, status: "ATTENDING", event: { orgId } },
    include: { profile: { select: { id: true, name: true, realName: true } } },
    orderBy: { createdAt: "asc" },
  });
}

async function getRsvpByEventAndUser(eventId: string, userId: string, orgId: string) {
  return prisma.calendarEventRsvp.findFirst({
    where: { eventId, userId, event: { orgId } },
  });
}

async function upsertRsvp(
  eventId: string,
  userId: string,
  status: "ATTENDING" | "NOT_ATTENDING",
  orgId: string,
) {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, orgId },
    select: { id: true },
  });
  if (!event) throw new Error("Event not found in org");

  return prisma.calendarEventRsvp.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status },
    update: { status, updatedAt: new Date() },
  });
}

async function deleteRsvp(eventId: string, userId: string, orgId: string) {
  return prisma.calendarEventRsvp.deleteMany({
    where: { eventId, userId, event: { orgId } },
  });
}

const RsvpRepository = {
  getRsvpsByEvent,
  getRsvpByEventAndUser,
  upsertRsvp,
  deleteRsvp,
};

export default RsvpRepository;
