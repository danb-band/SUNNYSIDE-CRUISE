"use server";

import { getCurrentUser } from "@/libs/supabase/auth";

export const getCurrentUserIdAction = async (): Promise<string> => {
  const user = await getCurrentUser();
  return user.id;
};
