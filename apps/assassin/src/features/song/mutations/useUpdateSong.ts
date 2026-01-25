import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import { SongUpdatePayload } from "../schema";

export const useUpdateSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, pw }: { id: string; data: SongUpdatePayload; pw: string }) =>
      updateSongAction(id, data, pw),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};
