import { useQuery } from "@tanstack/react-query";
import { getSongLikedByUserAction } from "../actions";
import { songLikeKeys } from "./keys";

export const useSongLiked = (songId: string) => {
  return useQuery({
    queryKey: songLikeKeys.byUser(songId),
    queryFn: () => getSongLikedByUserAction(songId),
  });
};
