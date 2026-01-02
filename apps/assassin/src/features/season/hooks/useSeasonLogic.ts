import { useCallback, useMemo } from "react";
import { useSeasons } from "../queries/useSeasons";
import type { Season, SeasonPayload } from "../schema";

export const useSeasonLogic = () => {
  // Get all seasons for business logic operations
  const { data: seasons = [] } = useSeasons();

  // Check if season name already exists (for duplicate validation)
  const checkNameExists = useCallback(
    (name: string, excludeId?: string): boolean => {
      return seasons.some(
        (season) => season.name.toLowerCase() === name.toLowerCase() && season.id !== excludeId,
      );
    },
    [seasons],
  );

  // Generate next available sort order
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

  // Validate season data with business rules
  const validateSeasonData = useCallback(
    (data: SeasonPayload, excludeId?: string): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      // Check name uniqueness
      if (checkNameExists(data.name, excludeId)) {
        errors.push(`Season name "${data.name}" already exists`);
      }

      // Check name format (no leading/trailing spaces, not empty after trim)
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        errors.push("Season name cannot be empty");
      } else if (trimmedName !== data.name) {
        errors.push("Season name cannot have leading or trailing spaces");
      }

      // Check name length
      if (trimmedName.length > 100) {
        errors.push("Season name cannot exceed 100 characters");
      }

      // Check sort order validity
      if (data.sortOrder < 0) {
        errors.push("Sort order must be a positive number");
      }

      // Check description length
      if (data.description && data.description.length > 500) {
        errors.push("Description cannot exceed 500 characters");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [checkNameExists],
  );

  // Check if season can be archived (has no active songs)
  const canArchiveSeason = useCallback(
    async (seasonId: string): Promise<{ canArchive: boolean; reason?: string }> => {
      // This would need to check if season has active songs
      // For now, we'll assume it can be archived
      // In a real implementation, you'd query the songs by season

      const season = seasons.find((s) => s.id === seasonId);
      if (!season) {
        return { canArchive: false, reason: "Season not found" };
      }

      if (season.isArchived) {
        return { canArchive: false, reason: "Season is already archived" };
      }

      // TODO: Check if season has active songs
      // const activeSongs = await getActiveSongsBySeason(seasonId);
      // if (activeSongs.length > 0) {
      //   return {
      //     canArchive: false,
      //     reason: `Season has ${activeSongs.length} active songs`
      //   };
      // }

      return { canArchive: true };
    },
    [seasons],
  );

  // Prepare season data with business logic applied
  const prepareSeasonData = useCallback(
    (inputData: Partial<SeasonPayload>): SeasonPayload => {
      return {
        name: inputData.name?.trim() || "",
        description: inputData.description?.trim() || "",
        sortOrder: inputData.sortOrder ?? getNextSortOrder(),
        isArchived: inputData.isArchived ?? false,
      };
    },
    [getNextSortOrder],
  );

  // Reorder seasons (for drag and drop functionality)
  const reorderSeasons = useCallback(
    (fromId: string, toPosition: number): Season[] => {
      const reordered = [...seasons];
      const fromIndex = reordered.findIndex((s) => s.id === fromId);

      if (fromIndex === -1) return seasons;

      const [movedSeason] = reordered.splice(fromIndex, 1);
      reordered.splice(toPosition, 0, movedSeason);

      // Recalculate sort orders
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
    // Business logic functions
    checkNameExists,
    getNextSortOrder,
    getSortOrderBetween,
    validateSeasonData,
    canArchiveSeason,
    prepareSeasonData,
    reorderSeasons,

    // Computed data
    activeSeasons,
    archivedSeasons,
    seasonsCount,
  };
};
