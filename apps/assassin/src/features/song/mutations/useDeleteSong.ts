import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSongAction } from "../actions";
import { songKeys } from "../queries/keys";

export const useDeleteSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSongAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};
