import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (id: string) => deleteCalendarEventAction(id, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
    },
  });
};
