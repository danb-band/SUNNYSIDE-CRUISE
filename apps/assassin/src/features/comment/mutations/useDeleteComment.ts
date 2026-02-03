import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommentAction } from "../actions";
import { commentKeys } from "../queries/keys";

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, songId }: { id: string; songId: string }) => deleteCommentAction(id, songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
  });
};
