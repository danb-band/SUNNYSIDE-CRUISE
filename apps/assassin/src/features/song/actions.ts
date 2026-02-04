"use server";

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
  return await SongService.createSong({ ...data, userId: user.id });
};

export const updateSongAction = async (id: string, data: SongUpdatePayload) => {
  return await SongService.updateSong(id, data);
};

export const deleteSongAction = async (id: string) => {
  return await SongService.deleteSong(id);
};
