import { updateTag } from "next/cache";

export const PROFILE_CACHE_TAG = "profile";

export const revalidateProfile = (userId: string) => {
  updateTag(`${PROFILE_CACHE_TAG}-${userId}`);
};
