import { useSuspenseQuery } from "@tanstack/react-query";
import { getSeasonAction } from "../actions";
import { seasonKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useSeason = (id: string) => {
  const orgId = useOrgId();

  return useSuspenseQuery({
    queryKey: seasonKeys.detail(id),
    queryFn: () => getSeasonAction(id, orgId),
  });
};
