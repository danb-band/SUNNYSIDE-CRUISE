import { useSuspenseQuery } from "@tanstack/react-query";
import { getOrgBySlugAction } from "../actions";
import { orgKeys } from "./keys";

export const useOrgBySlug = (orgSlug: string) => {
  return useSuspenseQuery({
    queryKey: orgKeys.bySlug(orgSlug),
    queryFn: () => getOrgBySlugAction(orgSlug),
  });
};
