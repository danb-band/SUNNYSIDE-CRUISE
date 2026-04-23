import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { playerKeys } from "@features/player/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

type PlayerRow = {
  songId?: string;
  song_id?: string;
};

const getSongId = (row: PlayerRow | undefined): string | null => {
  const songId = row?.songId ?? row?.song_id ?? null;
  return typeof songId === "string" ? songId : null;
};

export const useRealtimePlayerSync = (songId: string) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const playersChannel = supabase
      .channel(`realtime:player:${orgId}:${songId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "player" }, (payload) => {
        const nextRow = payload.new as PlayerRow | undefined;
        const prevRow = payload.old as PlayerRow | undefined;
        const affectedSongId = getSongId(nextRow) ?? getSongId(prevRow);

        if (affectedSongId && affectedSongId !== songId) return;
        queryClient.invalidateQueries({ queryKey: playerKeys.bySong(orgId, songId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
    };
  }, [orgId, queryClient, songId, supabase]);
};
