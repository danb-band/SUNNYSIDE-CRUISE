import SeasonRepository from "./repository";
import { assertOrgMember } from "@features/org/service";
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

const createSeason = async (season: SeasonPayload, orgId: string, userId: string): Promise<Season> => {
  await assertOrgMember(userId, orgId);

  const result = await SeasonRepository.createSeason(season, orgId);

  const parsed = seasonSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid season response from DB");
  }

  return parsed.data;
};

const getSeasonById = async (id: string, orgId: string, userId: string): Promise<Season> => {
  await assertOrgMember(userId, orgId);

  const season = await SeasonRepository.getSeasonById(id, orgId);

  const parsed = seasonSchema.safeParse(season);

  if (!parsed.success) {
    throw new Error("Invalid season response from DB");
  }

  return parsed.data;
};

const getAllSeasons = async (orgId: string, userId: string): Promise<Array<Season>> => {
  await assertOrgMember(userId, orgId);

  const seasons = await SeasonRepository.getAllSeasons(orgId);

  const parsed = seasonSchema.array().safeParse(seasons);

  if (!parsed.success) {
    throw new Error("Invalid season responses from DB");
  }

  return parsed.data;
};

const updateSeason = async (id: string, orgId: string, season: SeasonUpdatePayload, userId: string) => {
  await assertOrgMember(userId, orgId);

  const existing = await SeasonRepository.getSeasonById(id, orgId);
  const parsedExisting = seasonSchema.safeParse(existing);
  if (!parsedExisting.success) {
    throw new Error("Invalid season response from DB");
  }

  const parsedInput = updateSeasonSchema.safeParse(season);

  if (!parsedInput.success) {
    throw new Error("Invalid season input");
  }

  const newSeasonData: Season = { ...parsedExisting.data, ...parsedInput.data };

  const updatedSeason = await SeasonRepository.updateSeason(id, orgId, newSeasonData);

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
