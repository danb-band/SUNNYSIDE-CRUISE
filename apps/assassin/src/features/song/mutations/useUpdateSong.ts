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

      const cachedLists = queryClient.getQueriesData<Song[]>({ queryKey: songKeys.all });

      cachedLists.forEach(([key, data]) => {
        if (!data) return;
        if (!Array.isArray(key) || key[1] !== "bySeason") return;
        const seasonId = key[2] as string | undefined;
        if (!seasonId) return;

        queryClient.setQueryData(songKeys.bySeason(seasonId), (prev: Song[] | undefined) =>
          (prev ?? []).filter((song) => song.id !== updatedSong.id),
        );
      });

      queryClient.setQueryData(songKeys.bySeason(updatedSong.seasonId), (prev: Song[] | undefined) => {
        const next = [...(prev ?? []), updatedSong];
        return next
          .filter((song, index, arr) => arr.findIndex((it) => it.id === song.id) === index)
          .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
      });
    },
  });
};
