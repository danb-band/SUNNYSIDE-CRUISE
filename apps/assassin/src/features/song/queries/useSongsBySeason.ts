import { useQuery } from "@tanstack/react-query";
import { getSongsBySeasonAction } from "../actions";
import { songKeys } from "./keys";

export const useSongsBySeason = (seasonId: string) => {
  const isClient = typeof window !== "undefined";

  return useQuery({
    queryKey: songKeys.bySeason(seasonId),
    queryFn: () => getSongsBySeasonAction(seasonId),
    enabled: isClient && Boolean(seasonId),
  });
};
