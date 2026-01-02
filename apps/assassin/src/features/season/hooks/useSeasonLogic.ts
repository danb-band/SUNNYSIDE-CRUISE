import { useCallback, useMemo } from "react";
import { useSeasons } from "../queries/useSeasons";
import type { Season, SeasonPayload } from "../schema";

export const useSeasonLogic = () => {
  const { data: seasons = [] } = useSeasons();

  const isNameExists = useCallback(
    (name: string, excludeId?: string): boolean => {
      return seasons.some(
        (season) => season.name.toLowerCase() === name.toLowerCase() && season.id !== excludeId,
      );
    },
    [seasons],
  );

  const getNextSortOrder = useCallback((): number => {
    if (seasons.length === 0) return 1;

    const maxSortOrder = Math.max(...seasons.map((season) => season.sortOrder));
    return maxSortOrder + 1;
  }, [seasons]);

  // Get optimal sort order for insertion between two seasons
  const getSortOrderBetween = useCallback(
    (beforeId: string | null, afterId: string | null): number => {
      const sortedSeasons = [...seasons].sort((a, b) => a.sortOrder - b.sortOrder);

      if (!beforeId && !afterId) {
        return getNextSortOrder();
      }

      if (!beforeId) {
        // Insert at beginning
        const firstSeason = sortedSeasons[0];
        return firstSeason ? firstSeason.sortOrder - 1 : 1;
      }

      if (!afterId) {
        // Insert at end
        return getNextSortOrder();
      }

      // Insert between two seasons
      const beforeSeason = seasons.find((s) => s.id === beforeId);
      const afterSeason = seasons.find((s) => s.id === afterId);

      if (!beforeSeason || !afterSeason) {
        return getNextSortOrder();
      }

      return Math.floor((beforeSeason.sortOrder + afterSeason.sortOrder) / 2);
    },
    [seasons, getNextSortOrder],
  );

  const validateSeasonData = useCallback(
    (data: SeasonPayload, excludeId?: string): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (isNameExists(data.name, excludeId)) {
        errors.push(`Season name "${data.name}" already exists`);
      }

      const trimmedName = data.name.trim();
      if (!trimmedName) {
        errors.push("Season name cannot be empty");
      } else if (trimmedName !== data.name) {
        errors.push("Season name cannot have leading or trailing spaces");
      }

      if (data.sortOrder < 0) {
        errors.push("Sort order must be a positive number");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [isNameExists],
  );

  const reorderSeasons = useCallback(
    (fromId: string, toPosition: number): Season[] => {
      const reordered = [...seasons];
      const fromIndex = reordered.findIndex((s) => s.id === fromId);

      if (fromIndex === -1) return seasons;

      const [movedSeason] = reordered.splice(fromIndex, 1);
      reordered.splice(toPosition, 0, movedSeason);

      return reordered.map((season, index) => ({
        ...season,
        sortOrder: index + 1,
      }));
    },
    [seasons],
  );

  // Computed values
  const activeSeasons = useMemo(() => seasons.filter((season) => !season.isArchived), [seasons]);

  const archivedSeasons = useMemo(() => seasons.filter((season) => season.isArchived), [seasons]);

  const seasonsCount = useMemo(
    () => ({
      total: seasons.length,
      active: activeSeasons.length,
      archived: archivedSeasons.length,
    }),
    [seasons.length, activeSeasons.length, archivedSeasons.length],
  );

  return {
    isNameExists,
    getNextSortOrder,
    getSortOrderBetween,
    validateSeasonData,
    reorderSeasons,

    activeSeasons,
    archivedSeasons,
    seasonsCount,
  };
};
