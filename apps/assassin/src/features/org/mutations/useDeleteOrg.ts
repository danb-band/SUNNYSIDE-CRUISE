import { useMutation } from "@tanstack/react-query";
import { hardDeleteOrgAction } from "../actions";

export const useHardDeleteOrg = () => {
  return useMutation({
    mutationFn: (orgId: string) => hardDeleteOrgAction(orgId),
  });
};
