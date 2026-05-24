import { useQuery } from "@tanstack/react-query";
import { getSongLikedByUserAction } from "../actions";
import { songLikeKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useSongLiked = (songId: string) => {
  const orgId = useOrgId();

  return useQuery({
    queryKey: songLikeKeys.byUser(orgId, songId),
    queryFn: () => getSongLikedByUserAction(songId, orgId),
  });
};
