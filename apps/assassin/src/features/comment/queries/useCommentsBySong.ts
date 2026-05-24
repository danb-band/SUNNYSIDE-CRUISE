import { useSuspenseQuery } from "@tanstack/react-query";
import { getCommentsBySongAction } from "../actions";
import { commentKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useCommentsBySong = (songId: string) => {
  const orgId = useOrgId();

  return useSuspenseQuery({
    queryKey: commentKeys.bySong(orgId, songId),
    queryFn: () => getCommentsBySongAction(songId, orgId),
    staleTime: 1000 * 60,
  });
};
