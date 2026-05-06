import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSongToEventAction } from "../actions";
import { eventSongKeys } from "../queries/keys";
import { CreateEventSongPayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useAddEventSong = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (data: CreateEventSongPayload) => addSongToEventAction(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventSongKeys.byEvent(orgId, variables.eventId) });
    },
  });
};
