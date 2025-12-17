import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommentAction } from "../actions";
import { commentKeys } from "../queries/keys";
import { CommentPayload } from "../schema";

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CommentPayload) => createCommentAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
  });
};
