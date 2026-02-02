import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommentAction } from "../actions";
import { commentKeys } from "../queries/keys";
import type { CommentFormData } from "../hooks/useCommentForm";

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CommentFormData) => createCommentAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
  });
};
