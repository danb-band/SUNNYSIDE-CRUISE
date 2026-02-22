import { revalidatePath, revalidateTag } from "next/cache";

export const SEASON_BOARD_CACHE_TAG = "board";

export const revalidateSeasonBoard = () => {
  revalidatePath("/season");
  revalidateTag(SEASON_BOARD_CACHE_TAG, "max");
};
