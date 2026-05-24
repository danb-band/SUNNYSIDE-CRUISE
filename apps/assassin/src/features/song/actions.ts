"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import SongService from "./service";
import { SongUpdatePayload } from "./schema";

export const getSongAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  return await SongService.getSongByIdForUser(id, orgId, user.id);
};

export const getSongsBySeasonAction = async (seasonId: string, orgId: string) => {
  const user = await getCurrentUser();
  return await SongService.getSongsBySeasonId(seasonId, orgId, user.id);
};

export const createSongAction = async (
  orgId: string,
  data: {
    seasonId: string;
    name: string;
    artist: string;
    description: string;
    youtubeUrl: string;
    sortOrder: number;
  },
) => {
  const user = await getCurrentUser();
  const result = await SongService.createSong({ ...data, userId: user.id }, orgId);
  revalidateSeasonBoard(orgId);
  return result;
};

export const updateSongAction = async (id: string, orgId: string, data: SongUpdatePayload) => {
  const user = await getCurrentUser();
  const song = await SongService.updateSong(id, orgId, data, user.id);
  revalidateSeasonBoard(orgId);
  return song;
};

export const softDeleteSongAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  await SongService.softDeleteSong(id, orgId, user.id);
  revalidateSeasonBoard(orgId);
};
