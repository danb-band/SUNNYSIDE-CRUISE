"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import PlayerService from "./service";
import { PlayerPayload, PlayerUpdatePayload } from "./schema";

export const getPlayerAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  return await PlayerService.getPlayerById(id, orgId, user.id);
};

export const getPlayersBySongAction = async (songId: string, orgId: string) => {
  const user = await getCurrentUser();
  return await PlayerService.getPlayersBySongId(songId, orgId, user.id);
};

export const createPlayerAction = async (orgId: string, data: PlayerPayload) => {
  const user = await getCurrentUser();
  const result = await PlayerService.createPlayer(data, orgId, user.id);
  revalidateSeasonBoard(orgId);
  return result;
};

export const updatePlayerAction = async (id: string, orgId: string, data: PlayerUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await PlayerService.updatePlayer(id, orgId, data, user.id);
  revalidateSeasonBoard(orgId);
  return result;
};

export const softDeletePlayerAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  await PlayerService.softDeletePlayer(id, orgId, user.id);
  revalidateSeasonBoard(orgId);
};
