import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { rsvpKeys } from "../queries/keys";
import { useOrgId } from "@/components/org/OrgProvider";

type RsvpRow = {
  id?: string;
  eventId?: string;
  userId?: string;
  status?: string;
};

export const useRealtimeRsvpSync = (eventId: string) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:calendar_event_rsvp:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_event_rsvp" },
        (payload) => {
          const nextRow = payload.new as RsvpRow | undefined;
          const prevRow = payload.old as RsvpRow | undefined;
          const affectedEventId = nextRow?.eventId ?? prevRow?.eventId;

          if (affectedEventId !== undefined && affectedEventId !== eventId) return;

          queryClient.invalidateQueries({ queryKey: rsvpKeys.byEvent(orgId, eventId) });
          queryClient.invalidateQueries({ queryKey: rsvpKeys.byUser(orgId, eventId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient, eventId, supabase]);
};
