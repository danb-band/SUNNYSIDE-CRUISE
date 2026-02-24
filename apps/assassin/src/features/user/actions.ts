"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/libs/supabase/auth";
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

export const updateProfileAction = async (payload: UpdateProfilePayload) => {
  const user = await getCurrentUser();
  const result = await UserService.updateProfile(user.id, payload);
  revalidatePath("/profile");
  return result;
};
