import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlayerAction } from "../actions";
import { playerKeys } from "../queries/keys";
import { PlayerUpdatePayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlayerUpdatePayload }) =>
      updatePlayerAction(id, orgId, data),
    onSuccess: (updatedPlayer) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.bySong(orgId, updatedPlayer.songId) });
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === playerKeys.all[0] &&
          queryKey.some(
            (part) =>
              typeof part === "object" &&
              part !== null &&
              "orgId" in part &&
              (part as { orgId?: string }).orgId === orgId,
          ),
      });
    },
  });
};
