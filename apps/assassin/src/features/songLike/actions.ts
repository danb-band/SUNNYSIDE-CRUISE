"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import SongLikeService from "./service";

export const getSongLikedByUserAction = async (
  songId: string,
  orgId: string,
): Promise<string | null> => {
  const user = await getCurrentUser();
  return SongLikeService.getUserLikeIdForSong(songId, orgId, user.id);
};

export const toggleSongLikeAction = async (
  songId: string,
  orgId: string,
): Promise<{ likeId: string | null }> => {
  const user = await getCurrentUser();
  const result = await SongLikeService.toggleLike(songId, orgId, user.id);
  revalidateSeasonBoard(orgId);
  return result;
};
