import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleRsvpAction } from "../actions";
import { rsvpKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useToggleRsvp = (eventId: string) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: () => toggleRsvpAction(eventId, orgId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: rsvpKeys.byUser(orgId, eventId) });

      const previousStatus = queryClient.getQueryData<"ATTENDING" | "NOT_ATTENDING" | null>(
        rsvpKeys.byUser(orgId, eventId),
      );

      const nextStatus = previousStatus === "ATTENDING" ? "NOT_ATTENDING" : "ATTENDING";
      queryClient.setQueryData(rsvpKeys.byUser(orgId, eventId), nextStatus);

      return { previousStatus };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(rsvpKeys.byUser(orgId, eventId), context.previousStatus);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rsvpKeys.byEvent(orgId, eventId) });
      queryClient.invalidateQueries({ queryKey: rsvpKeys.byUser(orgId, eventId) });
    },
  });
};
