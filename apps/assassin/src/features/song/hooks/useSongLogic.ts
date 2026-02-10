import { useCallback, useMemo } from "react";
import type { Song } from "../schema";
import type { SongFormData } from "./useSongForm";
import { useSongsBySeason } from "../queries/useSongsBySeason";
import { createSongSortOrderHelpers } from "../utils/songSortOrderHelpers";

export const useSongLogic = (seasonId: string) => {
  const { data: songs = [] } = useSongsBySeason(seasonId);

  const { sortedSongs } = useMemo(() => createSongSortOrderHelpers(songs), [songs]);

  const isNameExists = useCallback(
    (name: string, excludeId?: string): boolean => {
      return songs.some(
        (song) => song.name.toLowerCase() === name.toLowerCase() && song.id !== excludeId,
      );
    },
    [songs],
  );

  const validateSongData = useCallback(
    (data: SongFormData, excludeId?: string): { isValid: boolean; errors: string[] } => {
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

  return {
    isNameExists,
    validateSongData,
    reorderSongs,

    songs: sortedSongs,
  };
};
