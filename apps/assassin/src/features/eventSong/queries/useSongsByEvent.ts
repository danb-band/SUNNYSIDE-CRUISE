import { useQuery } from "@tanstack/react-query";
import { getSongsByEventAction } from "../actions";
import { eventSongKeys } from "./keys";

export const useSongsByEvent = (eventId: string) => {
  return useQuery({
    queryKey: eventSongKeys.byEvent(eventId),
    queryFn: () => getSongsByEventAction(eventId),
    staleTime: 1000 * 60,
  });
};
