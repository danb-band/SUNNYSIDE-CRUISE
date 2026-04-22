import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSongAction } from "../actions";
import { songKeys } from "../queries/keys";
import type { SongFormData } from "../hooks/useSongForm";
import { useOrgId } from "@/components/org/OrgProvider";

export const useCreateSong = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (data: SongFormData) => createSongAction(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.org(orgId), exact: false });
    },
  });
};
