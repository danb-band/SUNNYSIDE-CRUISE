import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Player } from "@features/player/schema";
import { playerKeys } from "@features/player/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";

export const useRealtimePlayerSync = () => {
  const queryClient = useQueryClient();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const updateSongPlayers = (songId: string, updater: (prev: Player[]) => Player[]) => {
      queryClient.setQueryData(playerKeys.bySong(songId), (prev: Player[] | undefined) => {
        const current = prev ?? [];
        return updater(current);
      });
    };

    const removeSongPlayer = (songId: string, playerId: string) => {
      queryClient.removeQueries({ queryKey: playerKeys.detail(playerId) });
      updateSongPlayers(songId, (prev) => prev.filter((player) => player.id !== playerId));
    };

    const upsertSongPlayer = (songId: string, player: Player) => {
      queryClient.setQueryData(playerKeys.detail(player.id), player);
      updateSongPlayers(songId, (prev) => {
        const index = prev.findIndex((item) => item.id === player.id);
        if (index === -1) return [...prev, player];
        const updated = [...prev];
        updated[index] = { ...updated[index], ...player };
        return updated;
      });
    };

    const playersChannel = supabase
      .channel("realtime:player")
      .on("postgres_changes", { event: "*", schema: "public", table: "player" }, (payload) => {
        const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE" | undefined;
        const nextPlayer = payload.new as Player | undefined;
        const prevPlayer = payload.old as Player | undefined;

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

        if (eventType === "UPDATE") {
          if (
            prevPlayer?.songId &&
            nextPlayer.songId &&
            prevPlayer.songId !== nextPlayer.songId &&
            prevPlayer.id
          ) {
            removeSongPlayer(prevPlayer.songId, prevPlayer.id);
          }
        }

        upsertSongPlayer(nextPlayer.songId, nextPlayer);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
    };
  }, [queryClient, supabase]);
};
