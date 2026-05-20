import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeEventSongAction } from "../actions";
import { eventSongKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useRemoveEventSong = (eventId: string) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (id: string) => removeEventSongAction(id, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventSongKeys.byEvent(orgId, eventId) });
    },
  });
};
