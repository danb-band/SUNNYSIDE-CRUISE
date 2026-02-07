import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import SeasonService from "@features/season/service";
import SongService from "@features/song/service";
import type { Song } from "@features/song/schema";
import { cacheLife, cacheTag } from "next/cache";
import { SEASON_BOARD_CACHE_TAG } from "@/libs/cache/seasonBoard";

export default async function Home() {
  "use cache";
  cacheTag(SEASON_BOARD_CACHE_TAG);
  cacheLife("max");

  const seasons = await SeasonService.getAllSeasons();
  const songsBySeasonEntries = await Promise.all(
    seasons.map(async (season) => {
      const songs = await SongService.getSongsBySeasonId(season.id);
      return [season.id, songs] as const;
    }),
  );
  const songsBySeason = Object.fromEntries(songsBySeasonEntries) as Record<string, Song[]>;

  return <SeasonPageClient seasons={seasons} songsBySeason={songsBySeason} />;
}
