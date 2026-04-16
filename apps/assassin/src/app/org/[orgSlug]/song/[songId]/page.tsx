import { Suspense } from "react";
import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import { SongDetailPage } from "@/components/song/SongDetailPage";
import { getOrgBySlugAction } from "@features/org/actions";
import SeasonService from "@features/season/service";
import { seasonKeys } from "@features/season/queries/keys";
import SongService from "@features/song/service";
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
  cacheTag(SEASON_BOARD_CACHE_TAG);
  cacheLife("max");

  const queryClient = getQueryClient();

  const song = await queryClient.fetchQuery({
    queryKey: songKeys.detail(songId),
    queryFn: () => SongService.getSongById(songId),
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
        queryKey: songKeys.bySeason(season.id),
        queryFn: () => SongService.getSongsBySeasonId(season.id, orgId, userId),
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
