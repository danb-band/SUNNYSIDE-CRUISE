import { useEffect, useMemo } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import type { Comment } from "@features/comment/schema";
import { commentKeys } from "@features/comment/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";

type RawComment = Omit<Comment, "profile"> & { profile?: Comment["profile"] };

export const useRealtimeCommentSync = () => {
  const queryClient = useQueryClient();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const updateQuery = (
      songId: string,
      updater: (
        prev: InfiniteData<{ comments: Comment[]; nextCursor: string | null }>,
      ) => InfiniteData<{ comments: Comment[]; nextCursor: string | null }> | undefined,
    ) => {
      queryClient.setQueryData(
        commentKeys.bySong(songId),
        (prev: InfiniteData<{ comments: Comment[]; nextCursor: string | null }> | undefined) =>
          prev ? updater(prev) : prev,
      );
    };

    const removeSongComment = (songId: string, commentId: string) => {
      updateQuery(songId, (prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          comments: page.comments.filter((comment) => comment.id !== commentId),
        })),
      }));
    };

    const updateSongComments = (songId: string, commentId: string) => {
      updateQuery(songId, (prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          comments: page.comments.map((comment) =>
            comment.id === commentId ? { ...comment, ...comment } : comment,
          ),
        })),
      }));
    };

    const insertSongComment = (songId: string, comment: Comment) => {
      updateQuery(songId, (prev) => {
        if (prev.pages.length === 0) {
          return prev;
        }

        const firstPage = prev.pages[0];
        const nextFirstPage = {
          ...firstPage,
          comments: [comment, ...firstPage.comments],
        };

        return {
          ...prev,
          pages: [nextFirstPage, ...prev.pages.slice(1)],
        };
      });
    };

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from("profiles").select("id, name").eq("id", userId).single();
      return data;
    };

    const commentsChannel = supabase
      .channel("realtime:comment")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment" },
        async (payload) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE" | undefined;
          const nextComment = payload.new as RawComment | undefined;
          const prevComment = payload.old as RawComment | undefined;

          if (eventType === "DELETE") {
            if (prevComment?.songId && prevComment?.id) {
              removeSongComment(prevComment.songId, prevComment.id);
            }
            return;
          }

          if (!nextComment?.songId || !nextComment?.id) return;

          if (nextComment.deletedAt) {
            removeSongComment(nextComment.songId, nextComment.id);
            return;
          }

          const profile = await fetchProfile(nextComment.userId);
          if (!profile) return;

          if (eventType === "UPDATE") {
            updateSongComments(nextComment.songId, nextComment.id);
            return;
          }

          // INSERT
          insertSongComment(nextComment.songId, { ...nextComment, profile });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [queryClient, supabase]);
};
