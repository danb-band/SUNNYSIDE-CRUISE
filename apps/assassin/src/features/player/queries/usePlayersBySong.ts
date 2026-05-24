import { useSuspenseQuery } from "@tanstack/react-query";
import { getPlayersBySongAction } from "../actions";
import { playerKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

const INSTRUMENT_ORDER = ["DRUM", "GUITAR", "BASS", "KEYBOARD", "VOCAL"] as const;

export const usePlayersBySong = (songId: string) => {
  const orgId = useOrgId();

  return useSuspenseQuery({
    queryKey: playerKeys.bySong(orgId, songId),
    queryFn: () => getPlayersBySongAction(songId, orgId),
    select: (data) =>
      [...data].sort(
        (a, b) => INSTRUMENT_ORDER.indexOf(a.instrument) - INSTRUMENT_ORDER.indexOf(b.instrument),
      ),
  });
};
