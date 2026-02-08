import { Song } from "../schema";

export const createSongSortOrderHelpers = (songs: Song[]) => {
  const sortedSongs = [...songs].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

  const getNextSortOrder = (): number => {
    if (songs.length === 0) return 1;

    const maxSortOrder = Math.max(...songs.map((song) => Number(song.sortOrder)));
    return maxSortOrder + 1;
  };

  const getSortOrderBetween = (beforeId: string | null, afterId: string | null): number => {
    if (!beforeId && !afterId) {
      return getNextSortOrder();
    }

    if (!beforeId) {
      const firstSong = sortedSongs[0];
      return firstSong ? Number(firstSong.sortOrder) - 1 : 1;
    }

    if (!afterId) {
      return getNextSortOrder();
    }

    const beforeSong = songs.find((s) => s.id === beforeId);
    const afterSong = songs.find((s) => s.id === afterId);

    if (!beforeSong || !afterSong) {
      return getNextSortOrder();
    }

    return Math.floor((Number(beforeSong.sortOrder) + Number(afterSong.sortOrder)) / 2);
  };

  return {
    sortedSongs,
    getNextSortOrder,
    getSortOrderBetween,
  };
};
