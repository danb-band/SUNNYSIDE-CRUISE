import { useSuspenseQuery } from "@tanstack/react-query";
import { getPlayersBySongAction } from "../actions";
import { playerKeys } from "./keys";

export const usePlayersBySong = (songId: string) => {
  return useSuspenseQuery({
    queryKey: playerKeys.bySong(songId),
    queryFn: () => getPlayersBySongAction(songId),
  });
};
