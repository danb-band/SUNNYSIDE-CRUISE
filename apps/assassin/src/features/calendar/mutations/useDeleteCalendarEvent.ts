import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCalendarEventAction } from "../actions";
import { calendarEventKeys } from "../queries/keys";

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCalendarEventAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
    },
  });
};
