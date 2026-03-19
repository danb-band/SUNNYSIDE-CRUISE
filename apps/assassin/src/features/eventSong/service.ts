import { CreateEventSongPayload, EventSong, eventSongSchema } from "./schema";
import EventSongRepository from "./repository";

const getSongsByEvent = async (eventId: string): Promise<EventSong[]> => {
  const results = await EventSongRepository.getSongsByEventId(eventId);
  const parsed = eventSongSchema.array().safeParse(results);
  if (!parsed.success) {
    throw new Error("Invalid event song responses from DB");
  }
  return parsed.data;
};

const addSongToEvent = async (data: CreateEventSongPayload): Promise<EventSong> => {
  const result = await EventSongRepository.addSongToEvent(data);
  const parsed = eventSongSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error("Invalid event song response from DB");
  }
  return parsed.data;
};

const removeSongFromEvent = async (id: string): Promise<void> => {
  await EventSongRepository.removeSongFromEvent(id);
};

const EventSongService = {
  getSongsByEvent,
  addSongToEvent,
  removeSongFromEvent,
};

export default EventSongService;
