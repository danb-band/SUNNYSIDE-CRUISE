import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Player } from "@features/player/schema";
import { playerKeys } from "@features/player/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";

export const useRealtimePlayerSync = () => {
  const queryClient = useQueryClient();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const removeSongPlayer = (songId: string, playerId: string) => {
      queryClient.removeQueries({ queryKey: playerKeys.detail(playerId) });
      queryClient.setQueryData(playerKeys.bySong(songId), (prev: Player[] | undefined) =>
        (prev ?? []).filter((player) => player.id !== playerId),
      );
    };

    const playersChannel = supabase
      .channel("realtime:player")
      .on("postgres_changes", { event: "*", schema: "public", table: "player" }, (payload) => {
        const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE" | undefined;
        const nextPlayer = payload.new as Pick<Player, "id" | "songId" | "deletedAt"> | undefined;
        const prevPlayer = payload.old as Pick<Player, "id" | "songId"> | undefined;

        if (eventType === "DELETE") {
          if (prevPlayer?.songId && prevPlayer?.id) {
            removeSongPlayer(prevPlayer.songId, prevPlayer.id);
          }
          return;
        }

        if (!nextPlayer?.songId || !nextPlayer?.id) return;

        if (nextPlayer.deletedAt) {
          removeSongPlayer(nextPlayer.songId, nextPlayer.id);
          return;
        }

        if (
          eventType === "UPDATE" &&
          prevPlayer?.songId &&
          prevPlayer.songId !== nextPlayer.songId &&
          prevPlayer.id
        ) {
          removeSongPlayer(prevPlayer.songId, prevPlayer.id);
        }

        // payload.new doesn't include joined profile — invalidate to refetch with full data
        queryClient.invalidateQueries({ queryKey: playerKeys.bySong(nextPlayer.songId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
    };
  }, [queryClient, supabase]);
};
