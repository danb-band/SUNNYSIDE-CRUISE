import { useQuery } from "@tanstack/react-query";
import { getSongsByEventAction } from "../actions";
import { eventSongKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useSongsByEvent = (eventId: string) => {
  const orgId = useOrgId();

  return useQuery({
    queryKey: eventSongKeys.byEvent(orgId, eventId),
    queryFn: () => getSongsByEventAction(eventId),
    staleTime: 1000 * 60,
  });
};
