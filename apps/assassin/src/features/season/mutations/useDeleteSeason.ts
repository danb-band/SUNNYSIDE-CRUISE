import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hardDeleteSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useHardDeleteSeason = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => hardDeleteSeasonAction(id, orgId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.org(orgId) });
      queryClient.invalidateQueries({ queryKey: songKeys.byOrg(orgId) });
      queryClient.invalidateQueries({ queryKey: songKeys.bySeason(orgId, id) });
      queryClient.invalidateQueries({ queryKey: eventSongKeys.org(orgId) });
    },
  });
};
