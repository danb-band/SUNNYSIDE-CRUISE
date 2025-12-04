import SeasonRepository from "./repository";
import { seasonSchema } from "./schemas/season";

const assertSeasonExists = async (seasonId: string): Promise<void> => {
  const season = await SeasonRepository.getSeasonById(seasonId);

  const parsed = seasonSchema.safeParse(season);

  if (!parsed.success) {
    throw new Error(`Season with ID ${seasonId} does not exist.`);
  }
};

const SeasonService = { assertSeasonExists };

export default SeasonService;
