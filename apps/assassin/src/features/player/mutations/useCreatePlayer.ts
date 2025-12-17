import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlayerAction } from "../actions";
import { playerKeys } from "../queries/keys";
import { PlayerPayload } from "../schema";

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlayerPayload) => createPlayerAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerKeys.all });
    },
  });
};
