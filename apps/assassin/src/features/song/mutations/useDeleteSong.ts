import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import type { Song } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useDeleteSong = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id }: { id: string; seasonId?: string }) => deleteSongAction(id),

    onSuccess: (_, { id, seasonId }) => {
      if (seasonId) {
        queryClient.setQueriesData<Song[]>(
          { queryKey: songKeys.bySeason(orgId, seasonId) },
          (old) => old?.filter((s) => s.id !== id),
        );
      }

      queryClient.removeQueries({ queryKey: songKeys.detail(orgId, id) });

      queryClient.invalidateQueries({ queryKey: songKeys.byOrg(orgId) });
    },
  });
};
