import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommentAction } from "../actions";
import { commentKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (variables: { id: string; songId: string }) =>
      deleteCommentAction(variables.id, orgId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.bySong(orgId, variables.songId) });
    },
  });
};
