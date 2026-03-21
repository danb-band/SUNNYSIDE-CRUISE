import { Suspense } from "react";
import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import { SongDetailPage } from "@/components/song/SongDetailPage";
import { getSeasonsAction } from "@features/season/actions";
import { seasonKeys } from "@features/season/queries/keys";
import { getSongAction, getSongsBySeasonAction } from "@features/song/actions";
import { songKeys } from "@features/song/queries/keys";
import { getPlayersBySongAction } from "@features/player/actions";
import { playerKeys } from "@features/player/queries/keys";
import { getAllProfilesAction } from "@features/user/actions";
import { userKeys } from "@features/user/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { SEASON_BOARD_CACHE_TAG } from "@/libs/cache/seasonBoard";

interface Props {
  params: Promise<{ songId: string }>;
}

// 동기 shell — await 없이 params Promise를 Suspense 안 async 컴포넌트로 전달
export default function SongPage({ params }: Props) {
  return (
    <Suspense>
      <SongPageAsync params={params} />
    </Suspense>
  );
}

// Suspense 경계 안에서 동적 params 해석
async function SongPageAsync({ params }: Props) {
  const { songId } = await params;
  return <SongPageContent songId={songId} />;
}

// 데이터 페칭 및 렌더링 with "use cache"
async function SongPageContent({ songId }: { songId: string }) {
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

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: playerKeys.bySong(songId),
      queryFn: () => getPlayersBySongAction(songId),
    }),
    queryClient.prefetchQuery({
      queryKey: userKeys.allProfiles(),
      queryFn: getAllProfilesAction,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SeasonPageClient />
      <SongDetailPage songId={songId} />
    </HydrationBoundary>
  );
}
