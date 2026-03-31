import { useSuspenseQuery } from "@tanstack/react-query";
import { getPlayersBySongAction } from "../actions";
import { playerKeys } from "./keys";

const INSTRUMENT_ORDER = ["DRUM", "GUITAR", "BASS", "KEYBOARD", "VOCAL"] as const;

export const usePlayersBySong = (songId: string) => {
  return useSuspenseQuery({
    queryKey: playerKeys.bySong(songId),
    queryFn: () => getPlayersBySongAction(songId),
    select: (data) =>
      [...data].sort(
        (a, b) => INSTRUMENT_ORDER.indexOf(a.instrument) - INSTRUMENT_ORDER.indexOf(b.instrument),
      ),
  });
};
