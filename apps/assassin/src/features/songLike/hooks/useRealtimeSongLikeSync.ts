import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { songLikeKeys } from "../queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { Song } from "@features/song/schema";
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
      .channel(`realtime:song_like:${orgId}:${songId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song_like" }, (payload) => {
        const nextLike = payload.new as SongLikeRow | undefined;
        const prevLike = payload.old as SongLikeRow | undefined;

        const affectedSongId = nextLike?.songId ?? prevLike?.songId;
        const affectedUserId = nextLike?.userId ?? prevLike?.userId;

        if (affectedSongId && affectedSongId !== songId) return;
        if (affectedUserId && affectedUserId !== userId) return;

        const isInsert = payload.eventType === "INSERT";
        const likeId = isInsert ? (nextLike?.id ?? null) : null;
        const delta = isInsert ? 1 : -1;

        queryClient.setQueryData(songLikeKeys.byUser(orgId, songId), likeId);

        queryClient.setQueryData(songKeys.detail(orgId, songId), (old: Song | null | undefined) =>
          old ? { ...old, likeCount: old.likeCount + delta } : old,
        );

        queryClient.setQueriesData<Song[]>({ queryKey: songKeys.lists(orgId) }, (old) =>
          old?.map((s) => (s.id === songId ? { ...s, likeCount: s.likeCount + delta } : s)),
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
    };
  }, [orgId, queryClient, songId, supabase, userId]);
};
