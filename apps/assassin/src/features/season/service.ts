import SeasonRepository from "./repository";
import {
  Season,
  SeasonPayload,
  seasonSchema,
  SeasonUpdatePayload,
  updateSeasonSchema,
} from "./schema";

const assertSeasonExists = async (seasonId: string, orgId: string): Promise<void> => {
  const season = await SeasonRepository.getSeasonById(seasonId, orgId);

  const parsed = seasonSchema.safeParse(season);

  if (!parsed.success) {
    throw new Error(`Season with ID ${seasonId} does not exist.`);
  }
};

const createSeason = async (season: SeasonPayload, orgId: string): Promise<Season> => {
  const result = await SeasonRepository.createSeason(season, orgId);

  const parsed = seasonSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid season response from DB");
  }

  return parsed.data;
};

const getSeasonById = async (id: string, orgId: string): Promise<Season> => {
  const season = await SeasonRepository.getSeasonById(id, orgId);

  const parsed = seasonSchema.safeParse(season);

  if (!parsed.success) {
    throw new Error("Invalid season response from DB");
  }

  return parsed.data;
};

const getAllSeasons = async (orgId: string): Promise<Array<Season>> => {
  const seasons = await SeasonRepository.getAllSeasons(orgId);

  const parsed = seasonSchema.array().safeParse(seasons);

  if (!parsed.success) {
    throw new Error("Invalid season responses from DB");
  }

  return parsed.data;
};

const updateSeason = async (id: string, orgId: string, season: SeasonUpdatePayload) => {
  const existed = await getSeasonById(id, orgId);

  const parsedInput = updateSeasonSchema.safeParse(season);

  if (!parsedInput.success) {
    throw new Error("Invalid season input");
  }

  const newSeasonData: Season = { ...existed, ...parsedInput.data };

  const updatedSeason = await SeasonRepository.updateSeason(id, orgId, newSeasonData);

  const parsedOutput = seasonSchema.safeParse(updatedSeason);

  if (!parsedOutput.success) {
    throw new Error("Invalid season response from DB");
  }

  return parsedOutput.data;
};

const deleteSeason = async (id: string, orgId: string): Promise<void> => {
  await assertSeasonExists(id, orgId);
  await SeasonRepository.deleteSeason(id, orgId);
};

const SeasonService = {
  assertSeasonExists,
  createSeason,
  getSeasonById,
  getAllSeasons,
  updateSeason,
  deleteSeason,
};

export default SeasonService;
