"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import SeasonService from "./service";
import { SeasonPayload, SeasonUpdatePayload } from "./schema";

export const getSeasonsAction = async (orgId: string) => {
  return await SeasonService.getAllSeasons(orgId);
};

export const getSeasonAction = async (id: string, orgId: string) => {
  return await SeasonService.getSeasonById(id, orgId);
};

export const createSeasonAction = async (data: SeasonPayload, orgId: string) => {
  const result = await SeasonService.createSeason(data, orgId);
  revalidateSeasonBoard();

  return result;
};

export const updateSeasonAction = async (id: string, orgId: string, data: SeasonUpdatePayload) => {
  const result = await SeasonService.updateSeason(id, orgId, data);
  revalidateSeasonBoard();

  return result;
};
