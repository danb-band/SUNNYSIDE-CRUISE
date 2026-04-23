import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { songKeys } from "@features/song/queries/keys";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

export const useRealtimeSongSync = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const songsChannel = supabase
      .channel(`realtime:song:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song" }, () => {
        queryClient.invalidateQueries({ queryKey: songKeys.org(orgId) });
        queryClient.invalidateQueries({ queryKey: eventSongKeys.org(orgId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(songsChannel);
    };
  }, [orgId, queryClient, supabase]);
};
