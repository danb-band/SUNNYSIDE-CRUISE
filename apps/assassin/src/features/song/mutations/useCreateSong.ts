import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import type { SongFormData } from "../hooks/useSongForm";
import type { Song } from "../schema";

export const useCreateSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SongFormData) => createSongAction(data),
    onSuccess: (createdSong) => {
      if (!createdSong) return;
      queryClient.setQueryData(songKeys.detail(createdSong.id), createdSong);
      queryClient.setQueryData(
        songKeys.bySeason(createdSong.seasonId),
        (prev: Song[] | undefined) => {
          if (!prev) return [createdSong];
          const exists = prev.some((song) => song.id === createdSong.id);
          const next = exists ? prev : [...prev, createdSong];
          return [...next].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
        },
      );
    },
  });
};
