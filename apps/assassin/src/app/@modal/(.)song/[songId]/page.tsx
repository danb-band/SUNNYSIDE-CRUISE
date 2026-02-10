import { getSongAction } from "@features/song/actions";
import { songKeys } from "@features/song/queries/keys";
import { getPlayersBySongAction } from "@features/player/actions";
import { playerKeys } from "@features/player/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SongModalRoute } from "@/components/song/SongModalRoute";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ songId: string }>;
}

export default async function SongModalPage({ params }: Props) {
  const { songId } = await params;
  const queryClient = getQueryClient();

  const song = await queryClient.fetchQuery({
    queryKey: songKeys.detail(songId),
    queryFn: () => getSongAction(songId),
  });

  if (!song) {
    notFound();
  }

  await queryClient.prefetchQuery({
    queryKey: playerKeys.bySong(songId),
    queryFn: () => getPlayersBySongAction(songId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SongModalRoute songId={songId} />
    </HydrationBoundary>
  );
}
