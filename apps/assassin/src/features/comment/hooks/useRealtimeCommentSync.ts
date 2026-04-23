import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { commentKeys } from "@features/comment/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

type CommentRow = {
  songId?: string;
  song_id?: string;
};

const getSongId = (row: CommentRow | undefined): string | null => {
  const songId = row?.songId ?? row?.song_id ?? null;
  return typeof songId === "string" ? songId : null;
};

export const useRealtimeCommentSync = (songId: string) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const commentsChannel = supabase
      .channel(`realtime:comment:${orgId}:${songId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comment" }, (payload) => {
        const nextRow = payload.new as CommentRow | undefined;
        const prevRow = payload.old as CommentRow | undefined;
        const affectedSongId = getSongId(nextRow) ?? getSongId(prevRow);

        if (affectedSongId && affectedSongId !== songId) return;
        queryClient.invalidateQueries({ queryKey: commentKeys.bySong(orgId, songId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [orgId, queryClient, songId, supabase]);
};
