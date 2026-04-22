import { useSuspenseQuery } from "@tanstack/react-query";
import { getPlayerAction } from "../actions";
import { playerKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const usePlayer = (id: string) => {
  const orgId = useOrgId();

  return useSuspenseQuery({
    queryKey: playerKeys.detail(orgId, id),
    queryFn: () => getPlayerAction(id),
  });
};
