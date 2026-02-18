import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleSongLikeAction } from "../actions";
import { songLikeKeys } from "../queries/keys";

export const useToggleLike = (songId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleSongLikeAction(songId),
    onSuccess: (result) => {
      queryClient.setQueryData(songLikeKeys.byUser(songId), result.likeId);
    },
  });
};
