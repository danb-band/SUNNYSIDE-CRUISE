import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import type { SeasonUpdatePayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useUpdateSeason = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SeasonUpdatePayload }) =>
      updateSeasonAction(id, orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.org(orgId), exact: false });
    },
  });
};
