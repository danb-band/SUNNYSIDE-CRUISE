import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { calendarEventKeys } from "@features/calendar/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

export const useRealtimeCalendarEventSync = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();
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
            queryKey: calendarEventKeys.lists(orgId),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(calendarEventChannel);
    };
  }, [orgId, queryClient, supabase]);
};
