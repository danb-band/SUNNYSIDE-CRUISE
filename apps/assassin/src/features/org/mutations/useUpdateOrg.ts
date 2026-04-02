import { useMutation } from "@tanstack/react-query";
import { updateOrgAction } from "../actions";
import type { UpdateOrgPayload } from "../schema";

export const useUpdateOrg = () => {
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: UpdateOrgPayload }) =>
      updateOrgAction(orgId, data),
  });
};
