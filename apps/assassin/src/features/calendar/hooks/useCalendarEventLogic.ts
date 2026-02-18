import { useCallback } from "react";
import { useCalendarEvents } from "../queries/useCalendarEvents";
import type { CalendarEvent } from "../schema";

export const useCalendarEventLogic = () => {
  const { data: events = [] } = useCalendarEvents();

  const getEventsForDay = useCallback(
    (date: Date): CalendarEvent[] => {
      return events.filter((e) => {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        return date >= new Date(start.toDateString()) && date <= new Date(end.toDateString());
      });
    },
    [events],
  );

  return {
    events,
    getEventsForDay,
  };
};
