import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import type { Season } from "@features/season/schema";
import type { Song } from "@features/song/schema";
import { seasonKeys } from "@features/season/queries/keys";
import { songKeys } from "@features/song/queries/keys";

interface UseRealtimeSeasonSongSyncParams {
  supabase: SupabaseClient;
  setSeasons: Dispatch<SetStateAction<Season[]>>;
  setSongsBySeason: Dispatch<SetStateAction<Record<string, Song[]>>>;
}

export const useRealtimeSeasonSongSync = ({
  supabase,
  setSeasons,
  setSongsBySeason,
}: UseRealtimeSeasonSongSyncParams) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const updateSeasons = (updater: (prev: Season[]) => Season[]) => {
      setSeasons((prev) => {
        const next = updater(prev);
        queryClient.setQueryData(seasonKeys.lists(), next);
        return next;
      });
    };

    const updateSeasonSongs = (seasonId: string, updater: (prev: Song[]) => Song[]) => {
      setSongsBySeason((prev) => {
        const current = prev[seasonId] ?? [];
        const nextSongs = updater(current);
        const nextState = { ...prev, [seasonId]: nextSongs };
        queryClient.setQueryData(songKeys.bySeason(seasonId), nextSongs);
        return nextState;
      });
    };

    const removeSeasonSongs = (seasonId: string, songId: string) => {
      updateSeasonSongs(seasonId, (prev) => prev.filter((song) => song.id !== songId));
    };

    const upsertSeasonSong = (seasonId: string, song: Song) => {
      updateSeasonSongs(seasonId, (prev) => {
        const index = prev.findIndex((item) => item.id === song.id);
        if (index === -1) return [...prev, song];
        const updated = [...prev];
        updated[index] = { ...updated[index], ...song };
        return updated;
      });
    };

    const seasonsChannel = supabase
      .channel("realtime:season")
      .on("postgres_changes", { event: "*", schema: "public", table: "season" }, (payload) => {
        const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE" | undefined;
        if (eventType === "DELETE") {
          const deletedId = (payload.old as Season | undefined)?.id;
          if (!deletedId) return;
          updateSeasons((prev) => prev.filter((season) => season.id !== deletedId));
          return;
        }

        const nextSeason = payload.new as Season | undefined;
        if (!nextSeason) return;
        updateSeasons((prev) => {
          const index = prev.findIndex((season) => season.id === nextSeason.id);
          if (index === -1) return [...prev, nextSeason];
          const updated = [...prev];
          updated[index] = { ...updated[index], ...nextSeason };
          return updated;
        });
      })
      .subscribe();

    const songsChannel = supabase
      .channel("realtime:song")
      .on("postgres_changes", { event: "*", schema: "public", table: "song" }, (payload) => {
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
      supabase.removeChannel(seasonsChannel);
      supabase.removeChannel(songsChannel);
    };
  }, [queryClient, setSeasons, setSongsBySeason, supabase]);
};
