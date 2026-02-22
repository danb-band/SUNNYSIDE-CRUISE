import { useCallback } from "react";
import { useCalendarEvents } from "../queries/useCalendarEvents";
import type { CalendarEvent } from "../schema";

export const useCalendarEventLogic = (year: number, month: number) => {
  const { data: events = [] } = useCalendarEvents(year, month);

  const getEventsForDay = useCallback(
    (date: Date): CalendarEvent[] => {
      const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      
      return events.filter((e) => {
        const start = new Date(e.startDate);
        const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
        
        const end = new Date(e.endDate);
        const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
        
        return targetTime >= startTime && targetTime <= endTime;
      });
    },
    [events],
  );

  return {
    events,
    getEventsForDay,
  };
};
