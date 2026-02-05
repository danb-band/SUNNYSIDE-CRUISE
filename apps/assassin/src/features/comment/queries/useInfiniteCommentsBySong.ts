import { useInfiniteQuery } from "@tanstack/react-query";
import { getCommentsBySongPaginatedAction } from "../actions";
import { commentKeys } from "./keys";

const COMMENTS_PER_PAGE = 20;

export const useInfiniteCommentsBySong = (songId: string) => {
  return useInfiniteQuery({
    queryKey: commentKeys.bySong(songId),
    queryFn: ({ pageParam }) =>
      getCommentsBySongPaginatedAction(songId, COMMENTS_PER_PAGE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};
