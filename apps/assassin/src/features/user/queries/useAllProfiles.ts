import { useSuspenseQuery } from "@tanstack/react-query";
import { getProfilesBySongAction } from "../actions";
import { userKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useAllProfiles = (songId: string) => {
  const orgId = useOrgId();

  return useSuspenseQuery({
    queryKey: userKeys.profilesBySong(orgId, songId),
    queryFn: () => getProfilesBySongAction(songId),
  });
};
