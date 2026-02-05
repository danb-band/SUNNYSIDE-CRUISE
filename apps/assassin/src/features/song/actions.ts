"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@libs/supabase/auth";
import SongService from "./service";
import { SongUpdatePayload } from "./schema";

export const getSongAction = async (id: string) => {
  return await SongService.getSongById(id);
};

export const getSongsBySeasonAction = async (seasonId: string) => {
  return await SongService.getSongsBySeasonId(seasonId);
};

export const createSongAction = async (data: {
  seasonId: string;
  name: string;
  artist: string;
  description: string;
  youtubeUrl: string;
  sortOrder: number;
}) => {
  const user = await getCurrentUser();
  const result = await SongService.createSong({ ...data, userId: user.id });
  revalidatePath("/");
  return result;
};

export const updateSongAction = async (id: string, data: SongUpdatePayload) => {
  const result = await SongService.updateSong(id, data);
  revalidatePath("/");
  revalidatePath(`/songs/${id}`);
  return result;
};

export const deleteSongAction = async (id: string) => {
  const result = await SongService.deleteSong(id);
  revalidatePath("/");
  return result;
};
