import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import { SeasonBoardSkeleton } from "@/components/season/SeasonBoardSkeleton";
import { getSeasonsAction } from "@features/season/actions";
import { getSongsBySeasonAction } from "@features/song/actions";
import { getOrgBySlugAction } from "@features/org/actions";
import { seasonKeys } from "@features/season/queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { cacheLife, cacheTag } from "next/cache";
import { SEASON_BOARD_CACHE_TAG } from "@/libs/cache/seasonBoard";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

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
  return <OrgSeasonPageData orgId={org.id} />;
}

async function OrgSeasonPageData({ orgId }: { orgId: string }) {
  "use cache";
  cacheTag(SEASON_BOARD_CACHE_TAG);
  cacheLife("max");

  const queryClient = getQueryClient();
  const seasons = await queryClient.fetchQuery({
    queryKey: seasonKeys.lists(orgId),
    queryFn: () => getSeasonsAction(orgId),
  });

  await Promise.all(
    seasons.map((season) =>
      queryClient.prefetchQuery({
        queryKey: songKeys.bySeason(season.id),
        queryFn: () => getSongsBySeasonAction(season.id, orgId),
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
