"use server";

import { getCurrentUser } from "@libs/supabase/auth";
import EventSongService from "./service";
import { CreateEventSongPayload } from "./schema";

export const getSongsByEventAction = async (eventId: string) => {
  const user = await getCurrentUser();
  return EventSongService.getSongsByEvent(eventId, user.id);
};

export const addSongToEventAction = async (data: CreateEventSongPayload) => {
  const user = await getCurrentUser();
  return EventSongService.addSongToEvent(data, user.id);
};

export const removeEventSongAction = async (id: string) => {
  const user = await getCurrentUser();
  await EventSongService.removeSongFromEvent(id, user.id);
};
