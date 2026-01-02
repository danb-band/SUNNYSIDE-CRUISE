import { useCallback } from "react";
import { useSongs } from "../queries/useSongs";
import type { Song, SongPayload } from "../schema";

export const useSongLogic = (seasonId: string) => {
  const { data: songs = [] } = useSongs(seasonId);

  const isNameExists = useCallback(
    (name: string, excludeId?: string): boolean => {
      return songs.some(
        (song) => song.name.toLowerCase() === name.toLowerCase() && song.id !== excludeId,
      );
    },
    [songs],
  );

  const getNextSortOrder = useCallback((): number => {
    if (songs.length === 0) return 1;

    const maxSortOrder = Math.max(...songs.map((song) => Number(song.sortOrder)));
    return maxSortOrder + 1;
  }, [songs]);

  const getSortOrderBetween = useCallback(
    (beforeId: string | null, afterId: string | null): number => {
      const sortedSongs = [...songs].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

      if (!beforeId && !afterId) {
        return getNextSortOrder();
      }

      if (!beforeId) {
        // Insert at beginning
        const firstSong = sortedSongs[0];
        return firstSong ? Number(firstSong.sortOrder) - 1 : 1;
      }

      if (!afterId) {
        // Insert at end
        return getNextSortOrder();
      }

      // Insert between two songs
      const beforeSong = songs.find((s) => s.id === beforeId);
      const afterSong = songs.find((s) => s.id === afterId);

      if (!beforeSong || !afterSong) {
        return getNextSortOrder();
      }

      return Math.floor((Number(beforeSong.sortOrder) + Number(afterSong.sortOrder)) / 2);
    },
    [songs, getNextSortOrder],
  );

  const validateSongData = useCallback(
    (data: SongPayload, excludeId?: string): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (isNameExists(data.name, excludeId)) {
        errors.push(`Song name "${data.name}" already exists`);
      }

      const trimmedName = data.name.trim();
      if (!trimmedName) {
        errors.push("Song name cannot be empty");
      } else if (trimmedName !== data.name) {
        errors.push("Song name cannot have leading or trailing spaces");
      }

      const trimmedArtist = data.artist.trim();
      if (!trimmedArtist) {
        errors.push("Artist name cannot be empty");
      } else if (trimmedArtist !== data.artist) {
        errors.push("Artist name cannot have leading or trailing spaces");
      }

      if (Number(data.sortOrder) < 0) {
        errors.push("Sort order must be a positive number");
      }

      // YouTube URL validation
      try {
        const url = new URL(data.youtubeUrl);
        if (!url.hostname.includes("youtube.com") && !url.hostname.includes("youtu.be")) {
          errors.push("Invalid YouTube URL");
        }
      } catch {
        errors.push("Invalid YouTube URL format");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [isNameExists],
  );

  const reorderSongs = useCallback(
    (fromId: string, toPosition: number): Song[] => {
      const reordered = [...songs];
      const fromIndex = reordered.findIndex((s) => s.id === fromId);

      if (fromIndex === -1) return songs;

      const [movedSong] = reordered.splice(fromIndex, 1);
      reordered.splice(toPosition, 0, movedSong);

      return reordered.map((song, index) => ({
        ...song,
        sortOrder: index + 1,
      }));
    },
    [songs],
  );

  const sortedSongs = [...songs].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

  return {
    isNameExists,
    getNextSortOrder,
    getSortOrderBetween,
    validateSongData,
    reorderSongs,

    songs: sortedSongs,
  };
};
