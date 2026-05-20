import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { seasonKeys } from "@features/season/queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

type RealtimeSeasonRow = { orgId?: string; org_id?: string };

export const useRealtimeSeasonSync = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const seasonsChannel = supabase
      .channel(`realtime:season:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "season" }, (payload) => {
        const next = payload.new as RealtimeSeasonRow | null;
        const prev = payload.old as RealtimeSeasonRow | null;
        const payloadOrgId = next?.orgId ?? next?.org_id ?? prev?.orgId ?? prev?.org_id;

        if (payloadOrgId && payloadOrgId !== orgId) {
          return;
        }

        queryClient.invalidateQueries({ queryKey: seasonKeys.org(orgId) });
        queryClient.invalidateQueries({ queryKey: songKeys.byOrg(orgId) });
        queryClient.invalidateQueries({ queryKey: eventSongKeys.org(orgId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(seasonsChannel);
    };
  }, [orgId, queryClient, supabase]);
};
