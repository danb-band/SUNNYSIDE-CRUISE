import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useDeleteSong = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id }: { id: string; seasonId?: string }) => deleteSongAction(id, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.org(orgId), exact: false });
      queryClient.invalidateQueries({ queryKey: eventSongKeys.all, exact: false });
    },
  });
};
