import { revalidateTag } from "next/cache";

export const SEASON_BOARD_CACHE_TAG = "board";

export const revalidateSeasonBoard = () => {
  revalidateTag(SEASON_BOARD_CACHE_TAG, "max");
};
