import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import { SeasonBoardSkeleton } from "@/components/season/SeasonBoardSkeleton";
import { getOrgBySlugAction } from "@features/org/actions";
import SeasonService from "@features/season/service";
import SongService from "@features/song/service";
import { seasonKeys } from "@features/season/queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { cacheLife, cacheTag } from "next/cache";
import { SEASON_BOARD_CACHE_TAG } from "@/libs/cache/seasonBoard";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getCurrentUser } from "@libs/supabase/auth";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default function OrgSeasonPage({ params }: Props) {
  return (
    <Suspense fallback={<SeasonBoardSkeleton />}>
      <OrgSeasonPageInner params={params} />
    </Suspense>
  );
}

async function OrgSeasonPageInner({ params }: Props) {
  const { orgSlug } = await params;
  const org = await getOrgBySlugAction(orgSlug).catch(() => null);
  if (!org) notFound();
  const user = await getCurrentUser();
  return <OrgSeasonPageData orgId={org.id} userId={user.id} />;
}

async function OrgSeasonPageData({ orgId, userId }: { orgId: string; userId: string }) {
  "use cache";
  cacheTag(`${SEASON_BOARD_CACHE_TAG}-${orgId}`);
  cacheLife("max");

  const queryClient = getQueryClient();
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SeasonBoardSkeleton />}>
        <SeasonPageClient />
      </Suspense>
    </HydrationBoundary>
  );
}
