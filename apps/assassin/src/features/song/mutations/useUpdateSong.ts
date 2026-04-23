import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import type { SongUpdatePayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useUpdateSong = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SongUpdatePayload }) =>
      updateSongAction(id, orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.org(orgId) });
      queryClient.invalidateQueries({ queryKey: eventSongKeys.org(orgId) });
    },
  });
};
