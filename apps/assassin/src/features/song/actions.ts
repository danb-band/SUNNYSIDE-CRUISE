"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import OrgService from "@features/org/service";
import SongService from "./service";
import { SongUpdatePayload } from "./schema";

export const getSongAction = async (id: string) => {
  const user = await getCurrentUser();
  return await SongService.getSongByIdForUser(id, user.id);
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

export const updateSongAction = async (id: string, data: SongUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await SongService.updateSong(id, data, user.id);
  const orgId = await OrgService.getOrgIdBySongId(id);
  if (!orgId) {
    throw new Error(`Song with ID ${id} does not exist.`);
  }
  revalidateSeasonBoard(orgId);
  return result;
};

export const deleteSongAction = async (id: string) => {
  const user = await getCurrentUser();
  const orgId = await OrgService.getOrgIdBySongId(id);
  if (!orgId) {
    throw new Error(`Song with ID ${id} does not exist.`);
  }
  const result = await SongService.deleteSong(id, user.id);
  revalidateSeasonBoard(orgId);
  return result;
};
