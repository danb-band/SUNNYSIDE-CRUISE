"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@libs/supabase/auth";
import EventSongService from "./service";
import { CreateEventSongPayload } from "./schema";

export const getSongsByEventAction = async (eventId: string) => {
  const user = await getCurrentUser();
  return EventSongService.getSongsByEvent(eventId, user.id);
};

export const addSongToEventAction = async (data: CreateEventSongPayload) => {
  const user = await getCurrentUser();
  const result = await EventSongService.addSongToEvent(data, user.id);
  revalidatePath("/calendar");
  return result;
};

export const removeEventSongAction = async (id: string) => {
  const user = await getCurrentUser();
  await EventSongService.removeSongFromEvent(id, user.id);
  revalidatePath("/calendar");
};
