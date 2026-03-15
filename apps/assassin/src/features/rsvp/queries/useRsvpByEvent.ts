import { useQuery } from "@tanstack/react-query";
import { getRsvpAttendeesAction } from "../actions";
import { rsvpKeys } from "./keys";

export const useRsvpByEvent = (eventId: string) => {
  return useQuery({
    queryKey: rsvpKeys.byEvent(eventId),
    queryFn: () => getRsvpAttendeesAction(eventId),
    staleTime: 1000 * 60,
  });
};
