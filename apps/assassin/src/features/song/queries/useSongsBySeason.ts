import { useSuspenseQuery } from "@tanstack/react-query";
import { getSongsBySeasonAction } from "../actions";
import { songKeys } from "./keys";

export const useSongsBySeason = (seasonId: string) => {
  return useSuspenseQuery({
    queryKey: songKeys.bySeason(seasonId),
    queryFn: () => getSongsBySeasonAction(seasonId),
  });
};
