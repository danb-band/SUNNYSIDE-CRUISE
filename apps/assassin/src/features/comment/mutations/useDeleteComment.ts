import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommentAction } from "../actions";
import { commentKeys } from "../queries/keys";

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, pw }: { id: string; pw: string }) => deleteCommentAction(id, pw),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
  });
};
