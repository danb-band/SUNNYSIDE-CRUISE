import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";

export const useDeleteSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSeasonAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.lists() });
    },
  });
};

