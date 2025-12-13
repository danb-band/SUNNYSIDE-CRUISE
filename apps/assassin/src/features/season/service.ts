import SeasonRepository from "./repository";
import { Season, seasonSchema } from "./schema";

const assertSeasonExists = async (seasonId: string): Promise<void> => {
  const season = await SeasonRepository.getSeasonById(seasonId);

  const parsed = seasonSchema.safeParse(season);

  if (!parsed.success) {
    throw new Error(`Season with ID ${seasonId} does not exist.`);
  }
};

const createSeason = async (season: Season) => {
  const result = await SeasonRepository.createSeason(season);

  const parsed = seasonSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid season response from DB");
  }

  return parsed.data;
};

const SeasonService = { assertSeasonExists };

export default SeasonService;
