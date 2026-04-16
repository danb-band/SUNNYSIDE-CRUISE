import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import type { Song, SongUpdatePayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useUpdateSong = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SongUpdatePayload }) =>
      updateSongAction(id, orgId, data),
    onSuccess: (updatedSong) => {
      if (!updatedSong) return;

      queryClient.setQueryData(songKeys.detail(updatedSong.id), updatedSong);

      queryClient.setQueryData(
        songKeys.bySeason(updatedSong.seasonId),
        (prev: Song[] | undefined) => {
          if (!prev) return [updatedSong];
          const exists = prev.some((song) => song.id === updatedSong.id);
          if (!exists) return [...prev, updatedSong];
          return prev.map((song) => (song.id === updatedSong.id ? updatedSong : song));
        },
      );
    },
  });
};
