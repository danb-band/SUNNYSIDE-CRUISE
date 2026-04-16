import { revalidateTag } from "next/cache";

export const CALENDAR_CACHE_TAG = "calendar";

export const revalidateCalendar = (orgId: string) => {
  revalidateTag(`${CALENDAR_CACHE_TAG}-${orgId}`, "max");
};
