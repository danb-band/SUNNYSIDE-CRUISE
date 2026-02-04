import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import SeasonService from "@features/season/service";
import SongService from "@features/song/service";
import type { Song } from "@features/song/schema";
import { unstable_cache } from "next/cache";

const getSeasons = unstable_cache(async () => SeasonService.getAllSeasons(), ["seasons"], {
  tags: ["seasons"],
});

const getSongsBySeason = (seasonId: string) =>
  unstable_cache(async () => SongService.getSongsBySeasonId(seasonId), ["songs", seasonId], {
    tags: ["songs", `songs:${seasonId}`],
  })();

export default async function Home() {
  const seasons = await getSeasons();
  const songsBySeasonEntries = await Promise.all(
    seasons.map(async (season) => {
      const songs = await getSongsBySeason(season.id);
      return [season.id, songs] as const;
    }),
  );
  const songsBySeason = Object.fromEntries(songsBySeasonEntries) as Record<string, Song[]>;

  return <SeasonPageClient seasons={seasons} songsBySeason={songsBySeason} />;
}
