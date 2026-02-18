import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleSongLikeAction } from "../actions";
import { songLikeKeys } from "../queries/keys";
import { songKeys } from "@features/song/queries/keys";

export const useToggleLike = (songId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleSongLikeAction(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songLikeKeys.byUser(songId) });
      queryClient.invalidateQueries({ queryKey: songKeys.detail(songId) });
    },
  });
};
