import { useSuspenseQuery } from "@tanstack/react-query";
import { getSeasonsAction } from "../actions";
import { seasonKeys } from "./keys";
import type { Season } from "../schema";

export const useSeasons = (initialData?: Season[]) => {
  return useSuspenseQuery({
    queryKey: seasonKeys.lists(),
    queryFn: () => getSeasonsAction(),
    initialData,
  });
};
