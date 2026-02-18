import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";
import type { CalendarEventPayload } from "../schema";

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CalendarEventPayload) => createCalendarEventAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
    },
  });
};
