"use server";

import { getCurrentUser } from "@libs/supabase/auth";
import EventSongService from "./service";
import { CreateEventSongPayload } from "./schema";

export const getSongsByEventAction = async (eventId: string, orgId: string) => {
  const user = await getCurrentUser();
  return EventSongService.getSongsByEvent(eventId, orgId, user.id);
};

export const addSongToEventAction = async (orgId: string, data: CreateEventSongPayload) => {
  const user = await getCurrentUser();
  return EventSongService.addSongToEvent(data, orgId, user.id);
};

export const removeEventSongAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  await EventSongService.removeSongFromEvent(id, orgId, user.id);
};
