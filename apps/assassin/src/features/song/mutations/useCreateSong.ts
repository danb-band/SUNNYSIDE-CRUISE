import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import type { Song } from "../schema";
import type { SongFormData } from "../hooks/useSongForm";
import { useOrgId } from "@/components/org/OrgProvider";

export const useCreateSong = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (data: SongFormData) => createSongAction(orgId, data),

    onSuccess: (song) => {
      queryClient.setQueryData(songKeys.detail(orgId, song.id), song);

      queryClient.setQueriesData<Song[]>(
        { queryKey: songKeys.bySeason(orgId, song.seasonId) },
        (old) => {
          const list = old ?? [];
          return [...list, song].sort((a, b) => a.sortOrder - b.sortOrder);
        },
      );

      queryClient.invalidateQueries({ queryKey: songKeys.byOrg(orgId) });
    },
  });
};
