"use server";

import { revalidatePath } from "next/cache";
import EventSongService from "./service";
import { CreateEventSongPayload } from "./schema";

export const getSongsByEventAction = async (eventId: string) => {
  return EventSongService.getSongsByEvent(eventId);
};

export const addSongToEventAction = async (data: CreateEventSongPayload) => {
  const result = await EventSongService.addSongToEvent(data);
  revalidatePath("/calendar");
  return result;
};

export const removeEventSongAction = async (id: string) => {
  await EventSongService.removeSongFromEvent(id);
  revalidatePath("/calendar");
};
