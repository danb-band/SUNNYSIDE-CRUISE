import { useQuery } from "@tanstack/react-query";
import { getUserRsvpStatusAction } from "../actions";
import { rsvpKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useUserRsvpStatus = (eventId: string) => {
  const orgId = useOrgId();

  return useQuery({
    queryKey: rsvpKeys.byUser(orgId, eventId),
    queryFn: () => getUserRsvpStatusAction(eventId, orgId),
    staleTime: 1000 * 60,
  });
};
