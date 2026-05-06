import { prisma } from "@libs/prisma/client";
import { assertOrgMember } from "@features/org/service";
import SongRepository from "@features/song/repository";
import { CreateEventSongPayload, EventSong, eventSongSchema } from "./schema";
import EventSongRepository from "./repository";

const getEventOrgId = async (eventId: string): Promise<string> => {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId },
    select: { orgId: true },
  });
  if (!event?.orgId) throw new Error("CalendarEvent not found");
  return event.orgId;
};

const getSongsByEvent = async (eventId: string, userId: string): Promise<EventSong[]> => {
  const orgId = await getEventOrgId(eventId);
  await assertOrgMember(userId, orgId);
  const results = await EventSongRepository.getSongsByEventId(eventId);
  const parsed = eventSongSchema.array().safeParse(results);
  if (!parsed.success) {
    throw new Error("Invalid event song responses from DB");
  }
  return parsed.data;
};

const addSongToEvent = async (data: CreateEventSongPayload, userId: string): Promise<EventSong> => {
  const orgId = await getEventOrgId(data.eventId);
  await assertOrgMember(userId, orgId);

  const songOrgId = await SongRepository.getSongOrgIdById(data.songId);
  if (!songOrgId) {
    throw new Error(`Song with ID ${data.songId} does not exist.`);
  }
  if (songOrgId !== orgId) {
    throw new Error("Cross-org event-song link is not allowed");
  }

  const result = await EventSongRepository.addSongToEvent(data);
  const parsed = eventSongSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error("Invalid event song response from DB");
  }
  return parsed.data;
};

const removeSongFromEvent = async (id: string, userId: string): Promise<void> => {
  const eventSong = await prisma.calendarEventSong.findFirst({
    where: { id },
    select: { event: { select: { orgId: true } } },
  });
  if (!eventSong?.event.orgId) throw new Error("EventSong not found");
  await assertOrgMember(userId, eventSong.event.orgId);
  await EventSongRepository.removeSongFromEvent(id);
};

const EventSongService = {
  getSongsByEvent,
  addSongToEvent,
  removeSongFromEvent,
};

export default EventSongService;
