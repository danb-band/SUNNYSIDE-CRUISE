import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeEventSongAction } from "../actions";
import { eventSongKeys } from "../queries/keys";

export const useRemoveEventSong = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeEventSongAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventSongKeys.byEvent(eventId) });
    },
  });
};
