import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import type { Song } from "../schema";

export const useDeleteSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; seasonId?: string }) => deleteSongAction(id),
    onSuccess: (_result, variables) => {
      queryClient.removeQueries({ queryKey: songKeys.detail(variables.id) });

      if (variables.seasonId) {
        queryClient.setQueryData(
          songKeys.bySeason(variables.seasonId),
          (prev: Song[] | undefined) => prev?.filter((song) => song.id !== variables.id) ?? prev,
        );
        return;
      }
    },
  });
};
