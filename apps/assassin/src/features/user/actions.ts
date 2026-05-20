"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@libs/supabase/auth";
import UserService from "./service";
import { UpdateProfilePayload } from "./schema";

export const getCurrentUserIdAction = async (): Promise<string> => {
  const user = await getCurrentUser();
  return user.id;
};

export const getCurrentUserProfileAction = async () => {
  const user = await getCurrentUser();
  return await UserService.getProfile(user.id);
};

export const getProfilesBySongAction = async (songId: string, orgId: string) => {
  const user = await getCurrentUser();
  return await UserService.getProfilesBySong(songId, orgId, user.id);
};

export const updateProfileAction = async (payload: UpdateProfilePayload) => {
  const user = await getCurrentUser();
  const result = await UserService.updateProfile(payload, user.id);
  revalidatePath("/profile");
  return result;
};
