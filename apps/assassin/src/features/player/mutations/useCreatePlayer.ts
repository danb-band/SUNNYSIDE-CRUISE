import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlayerAction } from "../actions";
import { playerKeys } from "../queries/keys";
import { PlayerPayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (data: PlayerPayload) => createPlayerAction(data, orgId),
    onSuccess: (createdPlayer) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.bySong(orgId, createdPlayer.songId) });
    },
  });
};
