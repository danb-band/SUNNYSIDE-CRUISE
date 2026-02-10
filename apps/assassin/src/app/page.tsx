import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import { getSeasonsAction } from "@features/season/actions";
import { getSongsBySeasonAction } from "@features/song/actions";
import { seasonKeys } from "@features/season/queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { cacheLife, cacheTag } from "next/cache";
import { SEASON_BOARD_CACHE_TAG } from "@/libs/cache/seasonBoard";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function Home() {
  "use cache";
  cacheTag(SEASON_BOARD_CACHE_TAG);
  cacheLife("max");

  const queryClient = getQueryClient();
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SeasonPageClient />
    </HydrationBoundary>
  );
}
