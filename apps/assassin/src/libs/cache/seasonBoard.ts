import { updateTag } from "next/cache";

export const SEASON_BOARD_CACHE_TAG = "board";

export const revalidateSeasonBoard = (orgId: string) => {
  updateTag(`${SEASON_BOARD_CACHE_TAG}-${orgId}`);
};
