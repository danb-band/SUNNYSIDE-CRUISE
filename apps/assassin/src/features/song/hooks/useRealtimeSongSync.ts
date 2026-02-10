import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Song } from "@features/song/schema";
import { songKeys } from "@features/song/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";

export const useRealtimeSongSync = () => {
  const queryClient = useQueryClient();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const updateSeasonSongs = (seasonId: string, updater: (prev: Song[]) => Song[]) => {
      queryClient.setQueryData(songKeys.bySeason(seasonId), (prev: Song[] | undefined) => {
        const current = prev ?? [];
        return updater(current);
      });
    };

    const removeSeasonSongs = (seasonId: string, songId: string) => {
      queryClient.removeQueries({ queryKey: songKeys.detail(songId) });

      updateSeasonSongs(seasonId, (prev) => prev.filter((song) => song.id !== songId));
    };

    const removeSongFromAllSeasons = (songId: string, excludeSeasonId?: string) => {
      const cachedLists = queryClient.getQueriesData<Song[]>({ queryKey: songKeys.all });

      cachedLists.forEach(([key, data]) => {
        if (!data) return;
        if (!Array.isArray(key) || key[1] !== "bySeason") return;
        const seasonId = key[2] as string | undefined;
        if (!seasonId) return;
        if (excludeSeasonId && seasonId === excludeSeasonId) return;

        updateSeasonSongs(seasonId, (prev) => prev.filter((song) => song.id !== songId));
      });
    };

    const upsertSeasonSong = (seasonId: string, song: Song) => {
      queryClient.setQueryData(songKeys.detail(song.id), song);

      updateSeasonSongs(seasonId, (prev) => {
        const index = prev.findIndex((item) => item.id === song.id);
        if (index === -1) return [...prev, song];
        const updated = [...prev];
        updated[index] = { ...updated[index], ...song };
        return updated;
      });
    };

    const songsChannel = supabase
      .channel("realtime:song")
      .on("postgres_changes", { event: "*", schema: "public", table: "song" }, (payload) => {
        console.log("Song payload:", payload);
        const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE" | undefined;
        const nextSong = payload.new as Song | undefined;
        const prevSong = payload.old as Song | undefined;

        if (eventType === "DELETE") {
          if (prevSong?.seasonId && prevSong?.id) {
            removeSeasonSongs(prevSong.seasonId, prevSong.id);
          }
          return;
        }

        if (!nextSong?.seasonId || !nextSong?.id) return;

        if (nextSong.deletedAt) {
          removeSeasonSongs(nextSong.seasonId, nextSong.id);
          return;
        }

        if (eventType === "UPDATE") {
          if (nextSong.id) {
            removeSongFromAllSeasons(nextSong.id, nextSong.seasonId);
          }

          if (
            prevSong?.seasonId &&
            nextSong.seasonId &&
            prevSong.seasonId !== nextSong.seasonId &&
            prevSong.id
          ) {
            removeSeasonSongs(prevSong.seasonId, prevSong.id);
          }
        }

        upsertSeasonSong(nextSong.seasonId, nextSong);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(songsChannel);
    };
  }, [queryClient, supabase]);
};
