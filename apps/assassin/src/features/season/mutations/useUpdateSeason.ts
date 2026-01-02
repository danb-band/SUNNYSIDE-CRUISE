import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import { SeasonUpdatePayload } from "../schema";

export const useUpdateSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SeasonUpdatePayload }) =>
      updateSeasonAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.lists() });
    },
  });
};
