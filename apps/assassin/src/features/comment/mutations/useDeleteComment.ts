import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommentAction } from "../actions";
import { commentKeys } from "../queries/keys";

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCommentAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
  });
};
