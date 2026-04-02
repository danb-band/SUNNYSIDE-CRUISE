"use server";

import { revalidatePath } from "next/cache";
import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import SongService from "./service";
import { SongUpdatePayload } from "./schema";

export const getSongAction = async (id: string) => {
  return await SongService.getSongById(id);
};

export const getSongsBySeasonAction = async (seasonId: string, orgId: string) => {
  return await SongService.getSongsBySeasonId(seasonId, orgId);
};

export const createSongAction = async (orgId: string, data: {
  seasonId: string;
  name: string;
  artist: string;
  description: string;
  youtubeUrl: string;
  sortOrder: number;
}) => {
  const user = await getCurrentUser();
  const result = await SongService.createSong({ ...data, userId: user.id }, orgId);
  revalidateSeasonBoard();
  return result;
};

export const updateSongAction = async (id: string, data: SongUpdatePayload) => {
  const result = await SongService.updateSong(id, data);
  revalidateSeasonBoard();
  revalidatePath(`/song/${id}`);
  return result;
};

export const deleteSongAction = async (id: string) => {
  const result = await SongService.deleteSong(id);
  revalidateSeasonBoard();
  return result;
};
