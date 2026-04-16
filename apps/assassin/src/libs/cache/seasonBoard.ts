import { revalidateTag } from "next/cache";

export const SEASON_BOARD_CACHE_TAG = "board";

export const revalidateSeasonBoard = (orgId: string) => {
  revalidateTag(`${SEASON_BOARD_CACHE_TAG}-${orgId}`, "max");
};
