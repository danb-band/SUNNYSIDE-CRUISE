import { prisma } from "@libs/prisma/client";
import { CreateEventSongPayload } from "./schema";

async function getSongsByEventId(eventId: string) {
  return prisma.calendarEventSong.findMany({
    where: { eventId },
    include: { song: { select: { id: true, name: true, artist: true } } },
    orderBy: { createdAt: "asc" },
  });
}

async function getEventIdByEventSongId(id: string): Promise<string | null> {
  const eventSong = await prisma.calendarEventSong.findFirst({
    where: { id },
    select: { eventId: true },
  });

  return eventSong?.eventId ?? null;
}

async function addSongToEvent(data: CreateEventSongPayload) {
  return prisma.calendarEventSong.create({
    data: { eventId: data.eventId, songId: data.songId },
    include: { song: { select: { id: true, name: true, artist: true } } },
  });
}

async function removeSongFromEvent(id: string) {
  return prisma.calendarEventSong.delete({ where: { id } });
}

const EventSongRepository = {
  getSongsByEventId,
  getEventIdByEventSongId,
  addSongToEvent,
  removeSongFromEvent,
};

export default EventSongRepository;
