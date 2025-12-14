import { useSuspenseQuery } from "@tanstack/react-query";
import { getCommentAction } from "../actions";
import { commentKeys } from "./keys";

export const useComment = (id: string) => {
  return useSuspenseQuery({
    queryKey: commentKeys.detail(id),
    queryFn: () => getCommentAction(id),
  });
};
