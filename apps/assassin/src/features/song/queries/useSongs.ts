import { useSuspenseQuery } from "@tanstack/react-query";
import { getSongsBySeasonAction } from "../actions";
import { songKeys } from "./keys";

export const useSongs = (seasonId: string) => {
  return useSuspenseQuery({
    queryKey: songKeys.lists(),
    queryFn: () => getSongsBySeasonAction(seasonId),
  });
};
