"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import SeasonService from "./service";
import { SeasonPayload, SeasonUpdatePayload } from "./schema";

export const getSeasonsAction = async () => {
  return await SeasonService.getAllSeasons();
};

export const getSeasonAction = async (id: string) => {
  return await SeasonService.getSeasonById(id);
};

export const createSeasonAction = async (data: SeasonPayload) => {
  const result = await SeasonService.createSeason(data);
  revalidateSeasonBoard();

  return result;
};

export const updateSeasonAction = async (id: string, data: SeasonUpdatePayload) => {
  const result = await SeasonService.updateSeason(id, data);
  revalidateSeasonBoard();

  return result;
};
