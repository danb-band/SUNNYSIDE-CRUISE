"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@libs/supabase/auth";
import SongLikeService from "./service";

export const getSongLikedByUserAction = async (songId: string): Promise<string | null> => {
  const user = await getCurrentUser();
  return SongLikeService.getUserLikeIdForSong(songId, user.id);
};

export const toggleSongLikeAction = async (songId: string): Promise<{ likeId: string | null }> => {
  const user = await getCurrentUser();
  const result = await SongLikeService.toggleLike(songId, user.id);
  revalidatePath(`/song/${songId}`);
  return result;
};
