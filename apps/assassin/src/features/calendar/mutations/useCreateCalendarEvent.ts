import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";
import type { CalendarEventPayload } from "../schema";
import { useOrgId } from "@/components/org/OrgProvider";

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (data: CalendarEventPayload) => createCalendarEventAction(data, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.lists(orgId) });
    },
  });
};
