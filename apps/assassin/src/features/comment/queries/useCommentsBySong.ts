import { useSuspenseQuery } from "@tanstack/react-query";
import { getCommentsBySongAction } from "../actions";
import { commentKeys } from "./keys";

export const useCommentsBySong = (songId: string) => {
  return useSuspenseQuery({
    queryKey: commentKeys.bySong(songId),
    queryFn: () => getCommentsBySongAction(songId),
  });
};
