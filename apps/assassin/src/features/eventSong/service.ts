import { assertOrgMember } from "@features/org/service";
import OrgRepository from "@features/org/repository";
import { CreateEventSongPayload, EventSong, eventSongSchema } from "./schema";
import EventSongRepository from "./repository";
import { z } from "zod";

const getOrgIdByEvent = async (eventId: string): Promise<string> => {
  const orgId = await OrgRepository.getOrgIdByEvent(eventId);
  const parsedOrgId = z.uuid().safeParse(orgId);
  if (!parsedOrgId.success) throw new Error("CalendarEvent not found");
  return parsedOrgId.data;
};

const getSongsByEvent = async (eventId: string, userId: string): Promise<EventSong[]> => {
  const orgId = await getOrgIdByEvent(eventId);
  await assertOrgMember(userId, orgId);
  const results = await EventSongRepository.getSongsByEventId(eventId);
  const parsed = eventSongSchema.array().safeParse(results);
  if (!parsed.success) {
    throw new Error("Invalid event song responses from DB");
  }
  return parsed.data;
};

const addSongToEvent = async (data: CreateEventSongPayload, userId: string): Promise<EventSong> => {
  const orgId = await getOrgIdByEvent(data.eventId);
  await assertOrgMember(userId, orgId);

  const songOrgId = await OrgRepository.getOrgIdBySongId(data.songId);
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
  const eventId = await EventSongRepository.getEventIdByEventSongId(id);
  const parsedEventId = z.uuid().safeParse(eventId);
  if (!parsedEventId.success) throw new Error("EventSong not found");

  const orgId = await getOrgIdByEvent(parsedEventId.data);
  await assertOrgMember(userId, orgId);
  await EventSongRepository.removeSongFromEvent(id);
};

const EventSongService = {
  getSongsByEvent,
  addSongToEvent,
  removeSongFromEvent,
};

export default EventSongService;
