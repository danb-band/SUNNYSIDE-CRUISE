import { useInfiniteQuery } from "@tanstack/react-query";
import { getCommentsBySongPaginatedAction } from "../actions";
import { commentKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

const COMMENTS_PER_PAGE = 20;

export const useInfiniteCommentsBySong = (songId: string) => {
  const orgId = useOrgId();

  return useInfiniteQuery({
    queryKey: commentKeys.bySong(orgId, songId),
    queryFn: ({ pageParam }) =>
      getCommentsBySongPaginatedAction(songId, orgId, COMMENTS_PER_PAGE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60,
  });
};
