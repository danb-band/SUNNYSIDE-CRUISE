import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";
import type { CalendarEventUpdatePayload } from "../schema";

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventUpdatePayload }) =>
      updateCalendarEventAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
    },
  });
};
