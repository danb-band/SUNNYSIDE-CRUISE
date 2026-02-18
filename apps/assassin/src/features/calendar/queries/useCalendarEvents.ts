import { useSuspenseQuery } from "@tanstack/react-query";
import { getCalendarEventsAction } from "../actions";
import { calendarEventKeys } from "./keys";

export const useCalendarEvents = () => {
  return useSuspenseQuery({
    queryKey: calendarEventKeys.lists(),
    queryFn: () => getCalendarEventsAction(),
  });
};
