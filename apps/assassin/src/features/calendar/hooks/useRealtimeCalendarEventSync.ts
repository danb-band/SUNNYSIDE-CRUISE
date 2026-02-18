import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CalendarEvent } from "@features/calendar/schema";
import { calendarEventKeys } from "@features/calendar/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";

export const useRealtimeCalendarEventSync = () => {
  const queryClient = useQueryClient();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const calendarEventChannel = supabase
      .channel("realtime:calendar_event")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_event" },
        (payload) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE" | undefined;

          if (eventType === "DELETE") {
            const deletedId = (payload.old as CalendarEvent | undefined)?.id;
            if (!deletedId) return;
            queryClient.setQueryData(
              calendarEventKeys.lists(),
              (prev: CalendarEvent[] | undefined) =>
                prev ? prev.filter((e) => e.id !== deletedId) : prev,
            );
            return;
          }

          const next = payload.new as CalendarEvent | undefined;
          if (!next) return;

          if (eventType === "INSERT") {
            queryClient.setQueryData(
              calendarEventKeys.lists(),
              (prev: CalendarEvent[] | undefined) => (prev ? [...prev, next] : [next]),
            );
            return;
          }

          // UPDATE
          queryClient.setQueryData(
            calendarEventKeys.lists(),
            (prev: CalendarEvent[] | undefined) => {
              if (!prev) return prev;
              return prev.map((e) => (e.id === next.id ? { ...e, ...next } : e));
            },
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(calendarEventChannel);
    };
  }, [queryClient, supabase]);
};
