import { useQuery } from "@tanstack/react-query";
import { getSongsBySeasonAction } from "../actions";
import { songKeys } from "./keys";
import type { Song } from "../schema";

export const useSongsBySeason = (
  seasonId: string,
  initialData?: Song[],
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: songKeys.bySeason(seasonId),
    queryFn: () => getSongsBySeasonAction(seasonId),
    initialData,
    enabled: options?.enabled ?? true,
  });
};
