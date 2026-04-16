import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlayerAction } from "../actions";
import { playerKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id, songId }: { id: string; songId: string }) =>
      deletePlayerAction(id, songId, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerKeys.all });
    },
  });
};
