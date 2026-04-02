import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrgAction } from "../actions";
import type { Org, UpdateOrgPayload } from "../schema";
import { orgKeys } from "../queries/keys";

export const useUpdateOrg = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: UpdateOrgPayload }) =>
      updateOrgAction(orgId, data),
    onSuccess: (updatedOrg) => {
      if (!updatedOrg) return;

      queryClient.setQueryData<Org>(orgKeys.bySlug(updatedOrg.slug), updatedOrg);
    },
  });
};
