import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import type { Season, SeasonPayload } from "../schema";

export const useCreateSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SeasonPayload) => createSeasonAction(data),
    onSuccess: (createdSeason) => {
      if (!createdSeason) return;

      queryClient.setQueryData(seasonKeys.detail(createdSeason.id), createdSeason);

      queryClient.setQueryData(seasonKeys.lists(), (prev: Season[] | undefined) => {
        if (!prev) return [createdSeason];
        return [...prev, createdSeason];
      });
    },
  });
};
