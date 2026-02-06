import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import { SongDetailPage } from "@/components/song/SongDetailPage";
import SeasonService from "@features/season/service";
import SongService from "@features/song/service";
import type { Song } from "@features/song/schema";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ songId: string }>;
}

export default async function SongPage({ params }: Props) {
  const { songId } = await params;

  const [song, seasons] = await Promise.all([
    SongService.getSongById(songId),
    SeasonService.getAllSeasons(),
  ]);

  if (!song) {
    notFound();
  }

  const songsBySeasonEntries = await Promise.all(
    seasons.map(async (season) => {
      const songs = await SongService.getSongsBySeasonId(season.id);
      return [season.id, songs] as const;
    }),
  );
  const songsBySeason = Object.fromEntries(songsBySeasonEntries) as Record<string, Song[]>;

  return (
    <>
      <SeasonPageClient seasons={seasons} songsBySeason={songsBySeason} />
      <SongDetailPage song={song} />
    </>
  );
}
