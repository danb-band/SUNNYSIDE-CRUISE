import { useQuery } from "@tanstack/react-query";
import { getUserRsvpStatusAction } from "../actions";
import { rsvpKeys } from "./keys";

export const useUserRsvpStatus = (eventId: string) => {
  return useQuery({
    queryKey: rsvpKeys.byUser(eventId),
    queryFn: () => getUserRsvpStatusAction(eventId),
    staleTime: 1000 * 60,
  });
};
