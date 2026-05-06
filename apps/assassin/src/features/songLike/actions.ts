"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import SongLikeService from "./service";

export const getSongLikedByUserAction = async (songId: string): Promise<string | null> => {
  const user = await getCurrentUser();
  return SongLikeService.getUserLikeIdForSong(songId, user.id);
};

export const toggleSongLikeAction = async (
  songId: string,
): Promise<{ likeId: string | null; orgId: string }> => {
  const user = await getCurrentUser();
  const result = await SongLikeService.toggleLike(songId, user.id);
  revalidateSeasonBoard(result.orgId);
  return result;
};
