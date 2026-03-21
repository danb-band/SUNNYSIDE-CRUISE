import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSongToEventAction } from "../actions";
import { eventSongKeys } from "../queries/keys";
import { CreateEventSongPayload } from "../schema";

export const useAddEventSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventSongPayload) => addSongToEventAction(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventSongKeys.byEvent(variables.eventId) });
    },
  });
};
