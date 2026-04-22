import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import type { Song } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useDeleteSong = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id }: { id: string; seasonId?: string }) => deleteSongAction(id, orgId),
    onSuccess: (_result, variables) => {
      queryClient.removeQueries({ queryKey: songKeys.detail(orgId, variables.id) });

      if (variables.seasonId) {
        queryClient.setQueryData(
          songKeys.bySeason(orgId, variables.seasonId),
          (prev: Song[] | undefined) => prev?.filter((song) => song.id !== variables.id) ?? prev,
        );
      }

      queryClient.invalidateQueries({ queryKey: songKeys.org(orgId), exact: false });
    },
  });
};
