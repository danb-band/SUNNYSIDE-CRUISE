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
          if (!eventType) return;

          queryClient.invalidateQueries({
            queryKey: ["calendarEvents", "list"],
            exact: false,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(calendarEventChannel);
    };
  }, [queryClient, supabase]);
};
