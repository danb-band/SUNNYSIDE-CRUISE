import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommentAction } from "../actions";
import { commentKeys } from "../queries/keys";
import type { CommentFormData } from "../hooks/useCommentForm";
import { useOrgId } from "@/components/org/OrgProvider";

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (data: CommentFormData) => createCommentAction(data, orgId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.bySong(orgId, data.songId) });
    },
  });
};
