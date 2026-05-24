import { useMutation, useQueryClient } from "@tanstack/react-query";
import { softDeletePlayerAction } from "../actions";
import { playerKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useSoftDeletePlayer = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (variables: { id: string; songId: string }) =>
      softDeletePlayerAction(variables.id, orgId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.bySong(orgId, variables.songId) });
    },
  });
};
