import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCommentAction } from "../actions";
import { commentKeys } from "../queries/keys";
import { CommentUpdatePayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CommentUpdatePayload }) =>
      updateCommentAction(id, data),
    onSuccess: (data) => {
      if (!data) return;

      queryClient.invalidateQueries({ queryKey: commentKeys.bySong(orgId, data.songId) });
    },
  });
};
