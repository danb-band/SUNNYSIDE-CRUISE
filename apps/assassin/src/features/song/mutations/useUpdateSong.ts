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
      updateSongAction(id, data),

    onSuccess: (song) => {
      queryClient.setQueryData(songKeys.detail(orgId, song.id), song);

      queryClient.setQueriesData<Song[]>(
        { queryKey: songKeys.bySeason(orgId, song.seasonId) },
        (old) => old?.map((s) => (s.id === song.id ? song : s)),
      );

      queryClient.invalidateQueries({ queryKey: songKeys.byOrg(orgId) });
    },
  });
};
