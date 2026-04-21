import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import type { Season } from "../schema";
import { useOrgId } from "@libs/org/OrgProvider";

export const useDeleteSeason = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (id: string) => deleteSeasonAction(id, orgId),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: seasonKeys.detail(id) });
      queryClient.setQueryData(seasonKeys.lists(orgId), (prev: Season[] | undefined) =>
        prev ? prev.filter((season) => season.id !== id) : prev,
      );
    },
  });
};
