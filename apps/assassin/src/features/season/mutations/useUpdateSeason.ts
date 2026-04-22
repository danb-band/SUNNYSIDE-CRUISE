import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import type { Season, SeasonUpdatePayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useUpdateSeason = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SeasonUpdatePayload }) =>
      updateSeasonAction(id, orgId, data),
    onSuccess: (updatedSeason) => {
      if (!updatedSeason) return;

      queryClient.setQueryData(seasonKeys.detail(orgId, updatedSeason.id), updatedSeason);

      queryClient.setQueryData(seasonKeys.lists(orgId), (prev: Season[] | undefined) => {
        if (!prev) return [updatedSeason];
        const exists = prev.some((season) => season.id === updatedSeason.id);
        if (!exists) return [...prev, updatedSeason];
        return prev.map((season) => (season.id === updatedSeason.id ? updatedSeason : season));
      });
    },
  });
};
