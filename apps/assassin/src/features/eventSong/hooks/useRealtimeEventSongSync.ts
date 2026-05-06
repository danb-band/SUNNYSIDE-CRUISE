import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

type EventSongRow = {
  id?: string;
  eventId?: string;
  songId?: string;
};

export const useRealtimeEventSongSync = (eventId: string) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:calendar_event_song:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_event_song" },
        (payload) => {
          const nextRow = payload.new as EventSongRow | undefined;
          const prevRow = payload.old as EventSongRow | undefined;
          const affectedEventId = nextRow?.eventId ?? prevRow?.eventId;

          console.log("[Realtime Sync] Received event song change:", {
            eventType: payload.eventType,
            nextRow,
            prevRow,
          });

          // affectedEventId가 undefined인 경우는 REPLICA IDENTITY FULL 미설정으로 인해
          // DELETE payload에 eventId가 없는 것 — 어느 이벤트인지 모르므로 일단 invalidate
          if (affectedEventId !== undefined && affectedEventId !== eventId) return;

          queryClient.invalidateQueries({ queryKey: eventSongKeys.byEvent(orgId, eventId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient, eventId, supabase]);
};
