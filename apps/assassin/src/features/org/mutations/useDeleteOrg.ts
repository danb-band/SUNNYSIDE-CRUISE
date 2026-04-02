import { useMutation } from "@tanstack/react-query";
import { deleteOrgAction } from "../actions";

export const useDeleteOrg = () => {
  return useMutation({
    mutationFn: (orgId: string) => deleteOrgAction(orgId),
  });
};
