import { useSuspenseQuery } from "@tanstack/react-query";
import { getSongAction } from "../actions";
import { songKeys } from "./keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useSong = (id: string) => {
  const orgId = useOrgId();

  return useSuspenseQuery({
    queryKey: songKeys.detail(orgId, id),
    queryFn: () => getSongAction(id, orgId),
  });
};
