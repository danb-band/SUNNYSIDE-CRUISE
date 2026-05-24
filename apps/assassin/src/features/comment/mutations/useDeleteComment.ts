import { useMutation, useQueryClient } from "@tanstack/react-query";
import { softDeleteCommentAction } from "../actions";
import { commentKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useSoftDeleteComment = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (variables: { id: string; songId: string }) =>
      softDeleteCommentAction(variables.id, orgId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.bySong(orgId, variables.songId) });
    },
  });
};
