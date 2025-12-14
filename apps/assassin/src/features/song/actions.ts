"use server";

import SongService from "./service";
import { SongPayload, SongUpdatePayload } from "./schema";

export const getSongsAction = async () => {
  return await SongService.getAllSongs();
};

export const getSongAction = async (id: string) => {
  return await SongService.getSongById(id);
};

export const getSongsBySeasonAction = async (seasonId: string) => {
  return await SongService.getSongsBySeasonId(seasonId);
};

export const createSongAction = async (data: SongPayload) => {
  return await SongService.createSong(data);
};

export const updateSongAction = async (id: string, data: SongUpdatePayload) => {
  return await SongService.updateSong(id, data);
};

export const deleteSongAction = async (id: string) => {
  return await SongService.deleteSong(id);
};
