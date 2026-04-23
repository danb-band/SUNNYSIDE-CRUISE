import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleSongLikeAction } from "../actions";
import { songLikeKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useToggleLike = (songId: string) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: () => toggleSongLikeAction(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songLikeKeys.byUser(orgId, songId) });
    },
  });
};
