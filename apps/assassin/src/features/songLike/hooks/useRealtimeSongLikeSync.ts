import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Song } from "@features/song/schema";
import { songKeys } from "@features/song/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { getCurrentUserIdAction } from "../actions";
import { songLikeKeys } from "../queries/keys";

type SongLikeRow = {
  id?: string;
  songId?: string;
  userId?: string;
};

export const useRealtimeSongLikeSync = (songId: string) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    getCurrentUserIdAction().then(setUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const likesChannel = supabase
      .channel(`realtime:song_like:${songId}:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song_like" }, (payload) => {
        const eventType = payload.eventType as "INSERT" | "DELETE" | "UPDATE" | undefined;
        const nextLike = payload.new as SongLikeRow | undefined;
        const prevLike = payload.old as SongLikeRow | undefined;

        const affectedSongId = nextLike?.songId ?? prevLike?.songId;
        const affectedUserId = nextLike?.userId ?? prevLike?.userId;
        const affectedLikeId = nextLike?.id ?? prevLike?.id;
        const cachedLikeId = queryClient.getQueryData<string | null>(songLikeKeys.byUser(songId));

        if (eventType === "DELETE") {
          if (affectedLikeId && cachedLikeId && affectedLikeId === cachedLikeId) {
            queryClient.setQueryData(songLikeKeys.byUser(songId), null);
            return;
          }

          if (affectedSongId === songId && affectedUserId === userId) {
            queryClient.setQueryData(songLikeKeys.byUser(songId), null);
            return;
          }

          queryClient.invalidateQueries({ queryKey: songLikeKeys.byUser(songId) });
          return;
        }

        if (affectedSongId !== songId || affectedUserId !== userId) return;

        if (eventType === "INSERT") {
          queryClient.setQueryData(songLikeKeys.byUser(songId), nextLike?.id ?? null);
          return;
        }

        queryClient.invalidateQueries({ queryKey: songLikeKeys.byUser(songId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
    };
  }, [queryClient, songId, supabase, userId]);
};
