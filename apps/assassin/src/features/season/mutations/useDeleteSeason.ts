import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useDeleteSeason = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteSeasonAction(id, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.org(orgId), exact: false });
      queryClient.invalidateQueries({ queryKey: songKeys.org(orgId), exact: false });
      queryClient.invalidateQueries({ queryKey: eventSongKeys.org(orgId), exact: false });
    },
  });
};
