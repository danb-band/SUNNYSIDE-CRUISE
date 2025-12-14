import { useSuspenseQuery } from "@tanstack/react-query";
import { getCommentsAction } from "../actions";
import { commentKeys } from "./keys";

export const useComments = () => {
  return useSuspenseQuery({
    queryKey: commentKeys.lists(),
    queryFn: () => getCommentsAction(),
  });
};
