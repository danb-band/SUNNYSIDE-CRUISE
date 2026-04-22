import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import type { Season, SeasonPayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useCreateSeason = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (data: SeasonPayload) => createSeasonAction(data, orgId),
    onSuccess: (createdSeason) => {
      if (!createdSeason) return;

      queryClient.setQueryData(seasonKeys.detail(orgId, createdSeason.id), createdSeason);

      queryClient.setQueryData(seasonKeys.lists(orgId), (prev: Season[] | undefined) => {
        if (!prev) return [createdSeason];
        return [...prev, createdSeason];
      });
    },
  });
};
