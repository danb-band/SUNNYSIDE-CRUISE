import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import type { SongFormData } from "../hooks/useSongForm";

export const useCreateSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SongFormData) => createSongAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};
