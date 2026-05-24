import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hardDeleteCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useHardDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (id: string) => hardDeleteCalendarEventAction(id, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.lists(orgId) });
    },
  });
};
