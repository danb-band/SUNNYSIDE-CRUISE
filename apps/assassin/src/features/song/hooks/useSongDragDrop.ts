"use client";

import { useCallback, useMemo, useState } from "react";
import { DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import type { Song } from "../schema";
import { songKeys } from "../queries/keys";
import { useUpdateSong } from "../mutations/useUpdateSong";
import { createSongSortOrderHelpers } from "./useSongLogic";

const SEASON_DROPPABLE_PREFIX = "season:";

export const getSeasonDroppableId = (seasonId: string) => `${SEASON_DROPPABLE_PREFIX}${seasonId}`;

const isSeasonDroppableId = (id: string) => id.startsWith(SEASON_DROPPABLE_PREFIX);

const getSeasonIdFromDroppableId = (id: string) =>
  isSeasonDroppableId(id) ? id.slice(SEASON_DROPPABLE_PREFIX.length) : null;

interface UseSongDragDropOptions {
  seasonIds: string[];
}

export const useSongDragDrop = ({ seasonIds }: UseSongDragDropOptions) => {
  const queryClient = useQueryClient();
  const updateSong = useUpdateSong();
  const [activeSongId, setActiveSongId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
  );

  const getSeasonSongs = useCallback(
    (seasonId: string) => queryClient.getQueryData<Song[]>(songKeys.bySeason(seasonId)) ?? [],
    [queryClient],
  );

  const findSongById = useCallback(
    (songId: string) => {
      const fromDetail = queryClient.getQueryData<Song>(songKeys.detail(songId));
      if (fromDetail) return fromDetail;

      for (const seasonId of seasonIds) {
        const songs = getSeasonSongs(seasonId);
        const found = songs.find((song) => song.id === songId);
        if (found) return found;
      }

      return null;
    },
    [getSeasonSongs, queryClient, seasonIds],
  );

  const findSeasonIdBySongId = useCallback(
    (songId: string) => {
      for (const seasonId of seasonIds) {
        const songs = getSeasonSongs(seasonId);
        if (songs.some((song) => song.id === songId)) return seasonId;
      }

      return null;
    },
    [getSeasonSongs, seasonIds],
  );

  const activeSong = useMemo(
    () => (activeSongId ? findSongById(activeSongId) : null),
    [activeSongId, findSongById],
  );

  const updateSeasonSongs = useCallback(
    (seasonId: string, updater: (songs: Song[]) => Song[]) => {
      queryClient.setQueryData(songKeys.bySeason(seasonId), (prev: Song[] | undefined) => {
        return updater(prev ?? []);
      });
    },
    [queryClient],
  );

  const updateSongDetail = useCallback(
    (songId: string, data: Partial<Song>) => {
      queryClient.setQueryData(songKeys.detail(songId), (prev: Song | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...data,
        };
      });
    },
    [queryClient],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveSongId(String(event.active.id));
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveSongId(null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveSongId(null);

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);
      const fromSeasonId = findSeasonIdBySongId(activeId);

      if (!fromSeasonId) return;

      const targetSeasonId = getSeasonIdFromDroppableId(overId) ?? findSeasonIdBySongId(overId);

      if (!targetSeasonId) return;

      const fromSongs = getSeasonSongs(fromSeasonId);

      if (fromSeasonId === targetSeasonId) {
        const { sortedSongs, getSortOrderBetween } = createSongSortOrderHelpers(fromSongs);
        const activeIndex = sortedSongs.findIndex((song) => song.id === activeId);

        const targetIndex = (() => {
          if (isSeasonDroppableId(overId)) {
            return sortedSongs.length - 1;
          }

          return sortedSongs.findIndex((song) => song.id === overId);
        })();

        if (activeIndex === -1 || targetIndex === -1 || activeIndex === targetIndex) {
          return;
        }

        const nextOrder = arrayMove(sortedSongs, activeIndex, targetIndex);
        const newIndex = nextOrder.findIndex((song) => song.id === activeId);
        const beforeId = nextOrder[newIndex - 1]?.id ?? null;
        const afterId = nextOrder[newIndex + 1]?.id ?? null;
        const newSortOrder = getSortOrderBetween(beforeId, afterId);

        updateSeasonSongs(fromSeasonId, (songs) =>
          songs.map((song) =>
            song.id === activeId
              ? {
                  ...song,
                  sortOrder: newSortOrder,
                }
              : song,
          ),
        );
        updateSongDetail(activeId, { sortOrder: newSortOrder });

        await updateSong.mutateAsync({
          id: activeId,
          data: { sortOrder: newSortOrder },
        });

        return;
      }

      const targetSongs = getSeasonSongs(targetSeasonId);
      const { sortedSongs: targetSortedSongs, getSortOrderBetween } =
        createSongSortOrderHelpers(targetSongs);

      const [beforeId, afterId] = (() => {
        if (isSeasonDroppableId(overId)) {
          return [targetSortedSongs[targetSortedSongs.length - 1]?.id ?? null, null] as const;
        }

        const overIndex = targetSortedSongs.findIndex((song) => song.id === overId);
        if (overIndex === -1) return [null, null] as const;

        return [targetSortedSongs[overIndex - 1]?.id ?? null, targetSortedSongs[overIndex]?.id];
      })();

      const newSortOrder = getSortOrderBetween(beforeId, afterId);
      const activeSongData = findSongById(activeId);

      if (!activeSongData) return;

      const movedSong: Song = {
        ...activeSongData,
        seasonId: targetSeasonId,
        sortOrder: newSortOrder,
      };

      updateSeasonSongs(fromSeasonId, (songs) => songs.filter((song) => song.id !== activeId));
      updateSeasonSongs(targetSeasonId, (songs) => [...songs, movedSong]);
      updateSongDetail(activeId, {
        seasonId: targetSeasonId,
        sortOrder: newSortOrder,
      });

      await updateSong.mutateAsync({
        id: activeId,
        data: {
          seasonId: targetSeasonId,
          sortOrder: newSortOrder,
        },
      });
    },
    [
      findSeasonIdBySongId,
      findSongById,
      getSeasonSongs,
      updateSeasonSongs,
      updateSongDetail,
      updateSong,
    ],
  );

  return {
    sensors,
    activeSong,
    handleDragStart,
    handleDragCancel,
    handleDragEnd,
  };
};
