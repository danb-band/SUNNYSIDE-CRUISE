import { revalidatePath, revalidateTag } from "next/cache";

export const CALENDAR_CACHE_TAG = "calendar";

export const revalidateCalendar = () => {
  revalidatePath("/calendar");
  revalidateTag(CALENDAR_CACHE_TAG, "max");
};
