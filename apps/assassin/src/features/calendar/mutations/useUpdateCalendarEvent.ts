import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";
import type { CalendarEventUpdatePayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventUpdatePayload }) =>
      updateCalendarEventAction(id, orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.lists(orgId), exact: false });
    },
  });
};
