"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@libs/supabase/auth";
import SongLikeService from "./service";

export const getSongLikedByUserAction = async (songId: string): Promise<boolean> => {
  const user = await getCurrentUser();
  return SongLikeService.getUserLikeForSong(songId, user.id);
};

export const toggleSongLikeAction = async (songId: string): Promise<{ liked: boolean }> => {
  const user = await getCurrentUser();
  const result = await SongLikeService.toggleLike(songId, user.id);
  revalidatePath(`/song/${songId}`);
  return result;
};
