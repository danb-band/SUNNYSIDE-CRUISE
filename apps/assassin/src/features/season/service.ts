import SeasonRepository from "./repository";
import { Season, SeasonPayload, seasonSchema, SeasonUpdatePayload } from "./schema";

const assertSeasonExists = async (seasonId: string): Promise<void> => {
  const season = await SeasonRepository.getSeasonById(seasonId);

  const parsed = seasonSchema.safeParse(season);

  if (!parsed.success) {
    throw new Error(`Season with ID ${seasonId} does not exist.`);
  }
};

const createSeason = async (season: SeasonPayload): Promise<Season> => {
  const result = await SeasonRepository.createSeason(season);

  const parsed = seasonSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid season response from DB");
  }

  return parsed.data;
};

const getSeasonById = async (id: string): Promise<Season> => {
  const season = await SeasonRepository.getSeasonById(id);

  const parsed = seasonSchema.safeParse(season);

  if (!parsed.success) {
    throw new Error("Invalid season response from DB");
  }

  return parsed.data;
};

const getAllSeasons = async (): Promise<Array<Season>> => {
  const seasons = await SeasonRepository.getAllSeasons();

  const parsed = seasonSchema.array().safeParse(seasons);

  if (!parsed.success) {
    throw new Error("Invalid season responses from DB");
  }

  return parsed.data;
};

const updateSeason = async (id: string, season: SeasonUpdatePayload) => {
  const existed = await getSeasonById(id);

  const parsedInput = seasonSchema.safeParse(season);

  if (!parsedInput.success) {
    throw new Error("Invalid season input");
  }

  const newSeasonData: Season = { ...existed, ...parsedInput.data };

  const updatedSeason = await SeasonRepository.updateSeason(id, newSeasonData);

  const parsedOutput = seasonSchema.safeParse(updatedSeason);

  if (!parsedOutput.success) {
    throw new Error("Invalid season response from DB");
  }

  return parsedOutput.data;
};

const SeasonService = {
  assertSeasonExists,
  createSeason,
  getSeasonById,
  getAllSeasons,
  updateSeason,
};

export default SeasonService;
