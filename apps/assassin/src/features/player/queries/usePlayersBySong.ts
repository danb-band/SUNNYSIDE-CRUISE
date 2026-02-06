import { useSuspenseQuery } from "@tanstack/react-query";
import { getPlayersBySongAction } from "../actions";
import { playerKeys } from "./keys";
import type { Player } from "../schema";

export const usePlayersBySong = (songId: string, initialData?: Player[]) => {
  return useSuspenseQuery({
    queryKey: playerKeys.bySong(songId),
    queryFn: () => getPlayersBySongAction(songId),
    initialData,
  });
};
