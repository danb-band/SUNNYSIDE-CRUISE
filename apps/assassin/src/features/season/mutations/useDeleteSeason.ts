import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import { songKeys } from "@features/song/queries/keys";
import type { Season } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useDeleteSeason = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteSeasonAction(id, orgId),
    onSuccess: (_result, variables) => {
      queryClient.removeQueries({ queryKey: seasonKeys.detail(orgId, variables.id) });
      queryClient.removeQueries({ queryKey: songKeys.bySeason(orgId, variables.id) });

      queryClient.setQueryData(
        seasonKeys.lists(orgId),
        (prev: Season[] | undefined) =>
          prev?.filter((season) => season.id !== variables.id) ?? prev,
      );

      queryClient.invalidateQueries({ queryKey: seasonKeys.org(orgId), exact: false });
      queryClient.invalidateQueries({ queryKey: songKeys.org(orgId), exact: false });
    },
  });
};
