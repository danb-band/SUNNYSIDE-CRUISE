import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Song } from "@features/song/schema";
import { songKeys } from "@features/song/queries/keys";
import type { Season } from "@features/season/schema";
import { seasonKeys } from "@features/season/queries/keys";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import type { EventSong } from "@features/eventSong/schema";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

export const useRealtimeSongSync = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const getKnownSeasonIds = () => {
      const seasons = queryClient.getQueryData<Season[]>(seasonKeys.lists(orgId)) ?? [];
      return new Set(seasons.map((season) => season.id));
    };

    const isCurrentOrgSong = (song: Pick<Song, "seasonId"> | undefined) => {
      if (!song?.seasonId) return false;

      const knownSeasonIds = getKnownSeasonIds();
      if (knownSeasonIds.size === 0) {
        return true;
      }

      return knownSeasonIds.has(song.seasonId);
    };

    const isTrackedSong = (songId: string) => {
      if (queryClient.getQueryData(songKeys.detail(orgId, songId))) return true;

      const cachedSongLists = queryClient.getQueriesData<Song[]>({ queryKey: songKeys.org(orgId) });
      const existsInSongLists = cachedSongLists.some(([key, data]) => {
        if (!data) return false;
        if (!Array.isArray(key) || key[2] !== "bySeason") return false;
        return data.some((song) => song.id === songId);
      });
      if (existsInSongLists) return true;

      const cachedEventSongs = queryClient.getQueriesData<EventSong[]>({
        queryKey: eventSongKeys.all,
      });
      return cachedEventSongs.some(([, data]) =>
        data?.some((eventSong) => eventSong.songId === songId),
      );
    };

    const updateSeasonSongs = (seasonId: string, updater: (prev: Song[]) => Song[]) => {
      queryClient.setQueryData(songKeys.bySeason(orgId, seasonId), (prev: Song[] | undefined) => {
        const current = prev ?? [];
        const next = updater(current);
        return [...next].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
      });
    };

    const removeSeasonSongs = (seasonId: string, songId: string) => {
      queryClient.removeQueries({ queryKey: songKeys.detail(orgId, songId) });

      updateSeasonSongs(seasonId, (prev) => prev.filter((song) => song.id !== songId));
    };

    const removeSongFromAllSeasons = (songId: string, excludeSeasonId?: string) => {
      const cachedLists = queryClient.getQueriesData<Song[]>({ queryKey: songKeys.org(orgId) });

      cachedLists.forEach(([key, data]) => {
        if (!data) return;
        if (!Array.isArray(key) || key[2] !== "bySeason") return;
        const seasonId = (key[3] as { seasonId?: string } | undefined)?.seasonId;
        if (!seasonId) return;
        if (excludeSeasonId && seasonId === excludeSeasonId) return;

        updateSeasonSongs(seasonId, (prev) => prev.filter((song) => song.id !== songId));
      });
    };

    const removeEventSongReferences = (songId: string) => {
      const cachedEventSongs = queryClient.getQueriesData<EventSong[]>({
        queryKey: eventSongKeys.all,
      });
      cachedEventSongs.forEach(([key, data]) => {
        if (!data) return;
        if (!data.some((eventSong) => eventSong.songId === songId)) return;

        queryClient.setQueryData(
          key,
          data.filter((eventSong) => eventSong.songId !== songId),
        );
      });
    };

    const updateEventSongReferences = (song: Song) => {
      const cachedEventSongs = queryClient.getQueriesData<EventSong[]>({
        queryKey: eventSongKeys.all,
      });
      cachedEventSongs.forEach(([key, data]) => {
        if (!data) return;
        if (!data.some((eventSong) => eventSong.songId === song.id)) return;

        queryClient.setQueryData(
          key,
          data.map((eventSong) =>
            eventSong.songId === song.id
              ? {
                  ...eventSong,
                  song: {
                    ...eventSong.song,
                    name: song.name,
                    artist: song.artist,
                  },
                }
              : eventSong,
          ),
        );
      });
    };

    const upsertSeasonSong = (seasonId: string, song: Song) => {
      queryClient.setQueryData(songKeys.detail(orgId, song.id), song);

      updateSeasonSongs(seasonId, (prev) => {
        const index = prev.findIndex((item) => item.id === song.id);
        if (index === -1) return [...prev, song];
        const updated = [...prev];
        updated[index] = { ...updated[index], ...song };
        return updated;
      });
    };

    const songsChannel = supabase
      .channel(`realtime:song:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song" }, (payload) => {
        const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE" | undefined;
        if (!eventType) return;

        const nextSong = payload.new as Song | undefined;
        const prevSong = payload.old as Song | undefined;

        try {
          if (eventType === "DELETE") {
            const deletedSongId = prevSong?.id;
            if (!deletedSongId) return;

            if (!isCurrentOrgSong(prevSong) && !isTrackedSong(deletedSongId)) return;

            if (prevSong?.seasonId && prevSong?.id) {
              removeSeasonSongs(prevSong.seasonId, prevSong.id);
            } else {
              removeSongFromAllSeasons(deletedSongId);
            }
            removeEventSongReferences(deletedSongId);
            return;
          }

          if (!nextSong?.seasonId || !nextSong?.id) return;
          if (!isCurrentOrgSong(nextSong) && !isTrackedSong(nextSong.id)) return;

          if (nextSong.deletedAt) {
            removeSongFromAllSeasons(nextSong.id);
            removeSeasonSongs(nextSong.seasonId, nextSong.id);
            removeEventSongReferences(nextSong.id);
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
          updateEventSongReferences(nextSong);
        } finally {
          // Keep realtime stable even if local merge logic misses a case.
          queryClient.invalidateQueries({ queryKey: songKeys.org(orgId), exact: false });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(songsChannel);
    };
  }, [orgId, queryClient, supabase]);
};
