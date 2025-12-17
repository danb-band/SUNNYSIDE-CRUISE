import { useSuspenseQuery } from "@tanstack/react-query";
import { getSeasonAction } from "../actions";
import { seasonKeys } from "./keys";

export const useSeason = (id: string) => {
  return useSuspenseQuery({
    queryKey: seasonKeys.detail(id),
    queryFn: () => getSeasonAction(id),
  });
};

