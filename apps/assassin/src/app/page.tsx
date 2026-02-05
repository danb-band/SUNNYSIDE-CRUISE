import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import SeasonService from "@features/season/service";
import SongService from "@features/song/service";
import type { Song } from "@features/song/schema";
import { cacheLife } from "next/cache";

export default async function Home() {
  "use cache";
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
