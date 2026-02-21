import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";
import type { CalendarEvent } from "../schema";

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCalendarEventAction(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(calendarEventKeys.lists(), (prev: CalendarEvent[] | undefined) =>
        prev ? prev.filter((e) => e.id !== id) : prev,
      );
    },
  });
};
