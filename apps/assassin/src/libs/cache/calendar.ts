import { updateTag } from "next/cache";

export const CALENDAR_CACHE_TAG = "calendar";

export const revalidateCalendar = (orgId: string) => {
  updateTag(`${CALENDAR_CACHE_TAG}-${orgId}`);
};
