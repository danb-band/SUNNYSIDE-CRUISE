import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleRsvpAction } from "../actions";
import { rsvpKeys } from "../queries/keys";

export const useToggleRsvp = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleRsvpAction(eventId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: rsvpKeys.byUser(eventId) });

      const previousStatus = queryClient.getQueryData<"ATTENDING" | "NOT_ATTENDING" | null>(
        rsvpKeys.byUser(eventId),
      );

      const nextStatus = previousStatus === "ATTENDING" ? "NOT_ATTENDING" : "ATTENDING";
      queryClient.setQueryData(rsvpKeys.byUser(eventId), nextStatus);

      return { previousStatus };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(rsvpKeys.byUser(eventId), context.previousStatus);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rsvpKeys.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: rsvpKeys.byUser(eventId) });
    },
  });
};
