import { Suspense } from "react";
import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import { SongDetailPage } from "@/components/song/SongDetailPage";
import { getOrgBySlugAction } from "@features/org/actions";
import SeasonService from "@features/season/service";
import { seasonKeys } from "@features/season/queries/keys";
import SongService from "@features/song/service";
import { songKeys } from "@features/song/queries/keys";
import PlayerService from "@features/player/service";
import { playerKeys } from "@features/player/queries/keys";
import UserService from "@features/user/service";
import { userKeys } from "@features/user/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { SEASON_BOARD_CACHE_TAG } from "@/libs/cache/seasonBoard";
import { SONG_DETAIL_CACHE_TAG } from "@/libs/cache/songDetail";
import { getCurrentUser } from "@libs/supabase/auth";

interface Props {
  params: Promise<{ orgSlug: string; songId: string }>;
}

export default function OrgSongPage({ params }: Props) {
  return (
    <Suspense>
      <OrgSongPageAsync params={params} />
    </Suspense>
  );
}

async function OrgSongPageAsync({ params }: Props) {
  const { orgSlug, songId } = await params;
  const org = await getOrgBySlugAction(orgSlug).catch(() => null);
  if (!org) notFound();
  const user = await getCurrentUser();
  return <OrgSongPageContent songId={songId} orgId={org.id} userId={user.id} />;
}

async function OrgSongPageContent({
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
  cacheTag(`${SONG_DETAIL_CACHE_TAG}-${songId}`);
  cacheLife("max");

  const queryClient = getQueryClient();

  const song = await queryClient.fetchQuery({
    queryKey: songKeys.detail(orgId, songId),
    queryFn: () => SongService.getSongByIdInOrg(songId, orgId, userId),
  });

  if (!song) {
    notFound();
  }

  const seasons = await queryClient.fetchQuery({
    queryKey: seasonKeys.lists(orgId),
    queryFn: () => SeasonService.getAllSeasons(orgId, userId),
  });

  await Promise.all(
    seasons.map((season) =>
      queryClient.prefetchQuery({
        queryKey: songKeys.bySeason(orgId, season.id),
        queryFn: () => SongService.getSongsBySeasonId(season.id, orgId, userId),
      }),
    ),
  );

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: playerKeys.bySong(orgId, songId),
      queryFn: () => PlayerService.getPlayersBySongId(songId, orgId, userId),
    }),
    queryClient.prefetchQuery({
      queryKey: userKeys.profilesBySong(orgId, songId),
      queryFn: () => UserService.getProfilesBySong(songId, userId),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SeasonPageClient />
      <SongDetailPage songId={songId} />
    </HydrationBoundary>
  );
}
