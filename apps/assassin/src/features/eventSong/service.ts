import { assertOrgMember } from "@features/org/service";
import { CreateEventSongPayload, EventSong, eventSongSchema } from "./schema";
import EventSongRepository from "./repository";

const getSongsByEvent = async (
  eventId: string,
  orgId: string,
  userId: string,
): Promise<EventSong[]> => {
  await assertOrgMember(userId, orgId);
  const results = await EventSongRepository.getSongsByEventId(eventId, orgId);
  const parsed = eventSongSchema.array().safeParse(results);
  if (!parsed.success) {
    throw new Error("Invalid event song responses from DB");
  }
  return parsed.data;
};

const addSongToEvent = async (
  data: CreateEventSongPayload,
  orgId: string,
  userId: string,
): Promise<EventSong> => {
  await assertOrgMember(userId, orgId);
  const result = await EventSongRepository.addSongToEvent(data, orgId);
  const parsed = eventSongSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error("Invalid event song response from DB");
  }
  return parsed.data;
};

const removeSongFromEvent = async (id: string, orgId: string, userId: string): Promise<void> => {
  await assertOrgMember(userId, orgId);
  await EventSongRepository.removeSongFromEvent(id, orgId);
};

const EventSongService = {
  getSongsByEvent,
  addSongToEvent,
  removeSongFromEvent,
};

export default EventSongService;
