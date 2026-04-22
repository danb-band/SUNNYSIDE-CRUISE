import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { seasonKeys } from "@features/season/queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

export const useRealtimeSeasonSync = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const seasonsChannel = supabase
      .channel(`realtime:season:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "season" }, () => {
        queryClient.invalidateQueries({ queryKey: seasonKeys.org(orgId), exact: false });
        queryClient.invalidateQueries({ queryKey: songKeys.org(orgId), exact: false });
        queryClient.invalidateQueries({ queryKey: eventSongKeys.all, exact: false });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(seasonsChannel);
    };
  }, [orgId, queryClient, supabase]);
};
