import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import { SeasonPayload } from "../schema";

export const useCreateSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SeasonPayload) => createSeasonAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.lists() });
    },
  });
};

