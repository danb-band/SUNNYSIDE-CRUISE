import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSeasonAction } from "../actions";
import { seasonKeys } from "../queries/keys";
import type { SeasonPayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useCreateSeason = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (data: SeasonPayload) => createSeasonAction(data, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.org(orgId) });
    },
  });
};
