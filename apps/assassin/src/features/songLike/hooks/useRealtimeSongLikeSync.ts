import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { songLikeKeys } from "../queries/keys";
import { useCurrentUserId } from "@/features/user/hooks/useCurrentUserId";
import { useOrgId } from "@/components/org/OrgProvider";

type SongLikeRow = {
  id?: string;
  songId?: string;
  userId?: string;
};

export const useRealtimeSongLikeSync = (songId: string) => {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const orgId = useOrgId();

  const userId = useCurrentUserId();

  useEffect(() => {
    if (!userId) return;

    const likesChannel = supabase
      .channel(`realtime:song_like:${songId}:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song_like" }, (payload) => {
        const nextLike = payload.new as SongLikeRow | undefined;
        const prevLike = payload.old as SongLikeRow | undefined;

        const affectedSongId = nextLike?.songId ?? prevLike?.songId;
        const affectedUserId = nextLike?.userId ?? prevLike?.userId;
        if (affectedSongId !== songId || affectedUserId !== userId) return;
        queryClient.invalidateQueries({ queryKey: songLikeKeys.byUser(orgId, songId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
    };
  }, [orgId, queryClient, songId, supabase, userId]);
};
