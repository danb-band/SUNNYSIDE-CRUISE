import { useQuery } from "@tanstack/react-query";
import { getRsvpAttendeesAction } from "../actions";
import { rsvpKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useRsvpByEvent = (eventId: string) => {
  const orgId = useOrgId();

  return useQuery({
    queryKey: rsvpKeys.byEvent(orgId, eventId),
    queryFn: () => getRsvpAttendeesAction(eventId, orgId),
    staleTime: 1000 * 60,
  });
};
