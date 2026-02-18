import { useSuspenseQuery } from "@tanstack/react-query";
import { getCalendarEventsAction } from "../actions";
import { calendarEventKeys } from "./keys";
import type { CalendarEvent } from "../schema";

export const useCalendarEvents = () => {
  return useSuspenseQuery({
    queryKey: calendarEventKeys.lists(),
    queryFn: () => getCalendarEventsAction(),
    select: (data: CalendarEvent[]) =>
      [...data].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
  });
};
