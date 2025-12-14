import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlayerAction } from "../actions";
import { playerKeys } from "../queries/keys";

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePlayerAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerKeys.all });
    },
  });
};
