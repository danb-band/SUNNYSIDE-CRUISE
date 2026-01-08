import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSongAction } from "../actions";
import { songKeys } from "../queries/keys";

export const useDeleteSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, pw }: { id: string; pw: string }) => deleteSongAction(id, pw),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};
