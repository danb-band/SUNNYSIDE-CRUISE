"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import OrgService from "@features/org/service";
import SongLikeService from "./service";

export const getSongLikedByUserAction = async (songId: string): Promise<string | null> => {
  const user = await getCurrentUser();
  return SongLikeService.getUserLikeIdForSong(songId, user.id);
};

export const toggleSongLikeAction = async (songId: string): Promise<{ likeId: string | null }> => {
  const user = await getCurrentUser();
  const result = await SongLikeService.toggleLike(songId, user.id);
  const orgId = await OrgService.getOrgIdBySongId(songId);
  if (!orgId) {
    throw new Error(`Song with ID ${songId} does not exist.`);
  }
  revalidateSeasonBoard(orgId);
  return result;
};
