import { updateTag } from "next/cache";

export const SONG_DETAIL_CACHE_TAG = "song-detail";

export const revalidateSongDetail = (songId: string) => {
  updateTag(`${SONG_DETAIL_CACHE_TAG}-${songId}`);
};
