import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";
import type { CalendarEvent, CalendarEventPayload } from "../schema";

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CalendarEventPayload) => createCalendarEventAction(data),
    onSuccess: (createdEvent) => {
      if (!createdEvent) return;
      queryClient.setQueryData(calendarEventKeys.lists(), (prev: CalendarEvent[] | undefined) =>
        prev ? [...prev, createdEvent] : [createdEvent],
      );
    },
  });
};
