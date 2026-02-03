import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlayerAction } from "../actions";
import { playerKeys } from "../queries/keys";

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, songId }: { id: string; songId: string }) => deletePlayerAction(id, songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerKeys.all });
    },
  });
};
