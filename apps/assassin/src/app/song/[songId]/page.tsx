import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import { SongDetailPage } from "@/components/song/SongDetailPage";
import { getSeasonsAction } from "@features/season/actions";
import { seasonKeys } from "@features/season/queries/keys";
import { getSongAction, getSongsBySeasonAction } from "@features/song/actions";
import { songKeys } from "@features/song/queries/keys";
import { getPlayersBySongAction } from "@features/player/actions";
import { playerKeys } from "@features/player/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ songId: string }>;
}

export default async function SongPage({ params }: Props) {
  const { songId } = await params;

  const queryClient = getQueryClient();

  const song = await queryClient.fetchQuery({
    queryKey: songKeys.detail(songId),
    queryFn: () => getSongAction(songId),
  });

  if (!song) {
    notFound();
  }

  const seasons = await queryClient.fetchQuery({
    queryKey: seasonKeys.lists(),
    queryFn: getSeasonsAction,
  });

  await Promise.all(
    seasons.map((season) =>
      queryClient.prefetchQuery({
        queryKey: songKeys.bySeason(season.id),
        queryFn: () => getSongsBySeasonAction(season.id),
      }),
    ),
  );

  await queryClient.prefetchQuery({
    queryKey: playerKeys.bySong(songId),
    queryFn: () => getPlayersBySongAction(songId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SeasonPageClient />
      <SongDetailPage songId={songId} />
    </HydrationBoundary>
  );
}
