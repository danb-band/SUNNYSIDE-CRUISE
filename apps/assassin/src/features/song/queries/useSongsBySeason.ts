import { useSuspenseQuery } from "@tanstack/react-query";
import { getSongsBySeasonAction } from "../actions";
import { songKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useSongsBySeason = (seasonId: string) => {
  const orgId = useOrgId();

  return useSuspenseQuery({
    queryKey: songKeys.bySeason(seasonId),
    queryFn: () => getSongsBySeasonAction(seasonId, orgId),
  });
};
