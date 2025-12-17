"use server";

import SeasonService from "./service";
import { SeasonPayload, SeasonUpdatePayload } from "./schema";

export const getSeasonsAction = async () => {
  return await SeasonService.getAllSeasons();
};

export const getSeasonAction = async (id: string) => {
  return await SeasonService.getSeasonById(id);
};

export const createSeasonAction = async (data: SeasonPayload) => {
  return await SeasonService.createSeason(data);
};

export const updateSeasonAction = async (id: string, data: SeasonUpdatePayload) => {
  return await SeasonService.updateSeason(id, data);
};
