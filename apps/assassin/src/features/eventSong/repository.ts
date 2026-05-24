import { prisma } from "@libs/prisma/client";
import { CreateEventSongPayload } from "./schema";

async function getSongsByEventId(eventId: string, orgId: string) {
  return prisma.calendarEventSong.findMany({
    where: { eventId, event: { orgId } },
    include: { song: { select: { id: true, name: true, artist: true } } },
    orderBy: { createdAt: "asc" },
  });
}

async function addSongToEvent(data: CreateEventSongPayload, orgId: string) {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: data.eventId, orgId },
    select: { id: true },
  });
  if (!event) throw new Error("Event not found in org");

  const song = await prisma.song.findFirst({
    where: { id: data.songId, season: { orgId }, deletedAt: null },
    select: { id: true },
  });
  if (!song) throw new Error("Song not found in org");

  return prisma.calendarEventSong.create({
    data: { eventId: data.eventId, songId: data.songId },
    include: { song: { select: { id: true, name: true, artist: true } } },
  });
}

async function removeSongFromEvent(id: string, orgId: string) {
  return prisma.calendarEventSong.deleteMany({
    where: { id, event: { orgId } },
  });
}

const EventSongRepository = {
  getSongsByEventId,
  addSongToEvent,
  removeSongFromEvent,
};

export default EventSongRepository;
