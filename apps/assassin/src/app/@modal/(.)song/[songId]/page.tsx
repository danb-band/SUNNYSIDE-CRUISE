import { Suspense } from "react";
import { getSongAction } from "@features/song/actions";
import { songKeys } from "@features/song/queries/keys";
import { getPlayersBySongAction } from "@features/player/actions";
import { playerKeys } from "@features/player/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SongModalRoute } from "@/components/song/SongModalRoute";
import { notFound } from "next/navigation";
import { cacheTag, cacheLife } from "next/cache";
import { SEASON_BOARD_CACHE_TAG } from "@/libs/cache/seasonBoard";

interface Props {
  params: Promise<{ songId: string }>;
}

// 동기 shell — await 없이 params Promise를 Suspense 안 async 컴포넌트로 전달
export default function SongModalPage({ params }: Props) {
  return (
    <Suspense>
      <SongModalAsync params={params} />
    </Suspense>
  );
}

// Suspense 경계 안에서 동적 params 해석
async function SongModalAsync({ params }: Props) {
  const { songId } = await params;
  return <SongModalContent songId={songId} />;
}

// 데이터 페칭 및 렌더링 with "use cache"
async function SongModalContent({ songId }: { songId: string }) {
  "use cache";
  cacheTag(SEASON_BOARD_CACHE_TAG);
  cacheLife("max");

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
