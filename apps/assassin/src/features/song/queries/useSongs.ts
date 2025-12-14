import { useSuspenseQuery } from "@tanstack/react-query";
import { getSongsAction } from "../actions";
import { songKeys } from "./keys";

export const useSongs = () => {
  return useSuspenseQuery({
    queryKey: songKeys.lists(),
    queryFn: () => getSongsAction(),
  });
};
