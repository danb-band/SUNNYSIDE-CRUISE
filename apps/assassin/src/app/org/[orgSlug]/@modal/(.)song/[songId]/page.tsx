import { Suspense } from "react";
import { songKeys } from "@features/song/queries/keys";
import SongService from "@features/song/service";
import PlayerService from "@features/player/service";
import { playerKeys } from "@features/player/queries/keys";
import UserService from "@features/user/service";
import { userKeys } from "@features/user/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SongModalRoute } from "@/components/song/SongModalRoute";
import { notFound } from "next/navigation";
import { cacheTag, cacheLife } from "next/cache";
import { SEASON_BOARD_CACHE_TAG } from "@/libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import { getOrgBySlugAction } from "@features/org/actions";

interface Props {
  params: Promise<{ orgSlug: string; songId: string }>;
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
  const { orgSlug, songId } = await params;
  const org = await getOrgBySlugAction(orgSlug).catch(() => null);
  if (!org) {
    notFound();
  }
  const user = await getCurrentUser();
  return <SongModalContent songId={songId} orgId={org.id} userId={user.id} />;
}

// 데이터 페칭 및 렌더링 with "use cache"
async function SongModalContent({
  songId,
  orgId,
  userId,
}: {
  songId: string;
  orgId: string;
  userId: string;
}) {
  "use cache";
  cacheTag(`${SEASON_BOARD_CACHE_TAG}-${orgId}`);
  cacheLife("max");

  const queryClient = getQueryClient();

  const song = await queryClient.fetchQuery({
    queryKey: songKeys.detail(songId),
    queryFn: () => SongService.getSongByIdInOrg(songId, orgId, userId),
  });

  if (!song) {
    notFound();
  }

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: playerKeys.bySong(songId),
      queryFn: () => PlayerService.getPlayersBySongId(songId, userId),
    }),
    queryClient.prefetchQuery({
      queryKey: userKeys.profilesBySong(songId),
      queryFn: () => UserService.getProfilesBySong(songId, userId),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SongModalRoute songId={songId} />
    </HydrationBoundary>
  );
}
