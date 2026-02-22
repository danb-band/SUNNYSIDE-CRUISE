import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";
import type { CalendarEvent, CalendarEventUpdatePayload } from "../schema";

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventUpdatePayload }) =>
      updateCalendarEventAction(id, data),
    onSuccess: (updatedEvent) => {
      if (!updatedEvent) return;
      queryClient.setQueryData(calendarEventKeys.lists(), (prev: CalendarEvent[] | undefined) =>
        prev ? prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)) : prev,
      );
    },
  });
};
