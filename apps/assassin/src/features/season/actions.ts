"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import SeasonService from "./service";
import { SeasonPayload, SeasonUpdatePayload } from "./schema";

export const getSeasonsAction = async (orgId: string) => {
  const user = await getCurrentUser();
  return await SeasonService.getAllSeasons(orgId, user.id);
};

export const getSeasonAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  return await SeasonService.getSeasonById(id, orgId, user.id);
};

export const createSeasonAction = async (data: SeasonPayload, orgId: string) => {
  const user = await getCurrentUser();
  const result = await SeasonService.createSeason(data, orgId, user.id);
  revalidateSeasonBoard(orgId);

  return result;
};

export const updateSeasonAction = async (id: string, orgId: string, data: SeasonUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await SeasonService.updateSeason(id, orgId, data, user.id);
  revalidateSeasonBoard(orgId);

  return result;
};

export const hardDeleteSeasonAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  await SeasonService.hardDeleteSeason(id, orgId, user.id);
  revalidateSeasonBoard(orgId);
};
