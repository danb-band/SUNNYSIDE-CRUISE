import { useSuspenseQuery } from "@tanstack/react-query";
import { getSeasonsAction } from "../actions";
import { seasonKeys } from "./keys";

export const useSeasons = () => {
  return useSuspenseQuery({
    queryKey: seasonKeys.lists(),
    queryFn: () => getSeasonsAction(),
  });
};

