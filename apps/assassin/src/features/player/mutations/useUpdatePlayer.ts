import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlayerAction } from "../actions";
import { playerKeys } from "../queries/keys";
import { PlayerUpdatePayload } from "../schema";

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlayerUpdatePayload }) =>
      updatePlayerAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerKeys.all });
    },
  });
};
