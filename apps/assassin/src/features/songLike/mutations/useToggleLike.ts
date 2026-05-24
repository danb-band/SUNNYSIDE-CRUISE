import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleSongLikeAction } from "../actions";
import { songLikeKeys } from "../queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { Song } from "@features/song/schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useToggleLike = (songId: string) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: () => toggleSongLikeAction(songId, orgId),
    onSuccess: (data) => {
      const delta = data.likeId !== null ? 1 : -1;

      queryClient.setQueryData(songLikeKeys.byUser(orgId, songId), data.likeId);

      queryClient.setQueryData(songKeys.detail(orgId, songId), (old: Song | null | undefined) =>
        old ? { ...old, likeCount: old.likeCount + delta } : old,
      );

      queryClient.setQueriesData<Song[]>({ queryKey: songKeys.byOrg(orgId) }, (old) =>
        old?.map((s) => (s.id === songId ? { ...s, likeCount: s.likeCount + delta } : s)),
      );
    },
  });
};
