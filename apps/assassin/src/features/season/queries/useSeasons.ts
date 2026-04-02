import { useSuspenseQuery } from "@tanstack/react-query";
import { getSeasonsAction } from "../actions";
import { seasonKeys } from "./keys";
import { useOrgId } from "@libs/org/OrgProvider";

export const useSeasons = () => {
  const orgId = useOrgId();
  return useSuspenseQuery({
    queryKey: seasonKeys.lists(orgId),
    queryFn: () => getSeasonsAction(orgId),
  });
};
