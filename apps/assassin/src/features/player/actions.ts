"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import OrgRepository from "@features/org/repository";
import PlayerService from "./service";
import { PlayerPayload, PlayerUpdatePayload } from "./schema";
import PlayerRepository from "./repository";

const getOrgIdBySongId = async (songId: string): Promise<string> => {
  const orgId = await OrgRepository.getOrgIdBySongId(songId);
  if (!orgId) {
    throw new Error(`Song with ID ${songId} does not exist.`);
  }
  return orgId;
};

export const getPlayerAction = async (id: string) => {
  const user = await getCurrentUser();
  return await PlayerService.getPlayerById(id, user.id);
};

export const getPlayersBySongAction = async (songId: string) => {
  const user = await getCurrentUser();
  return await PlayerService.getPlayersBySongId(songId, user.id);
};

export const createPlayerAction = async (data: PlayerPayload) => {
  const user = await getCurrentUser();
  const result = await PlayerService.createPlayer(data, user.id);
  const orgId = await getOrgIdBySongId(result.songId);
  revalidateSeasonBoard(orgId);
  return result;
};

export const updatePlayerAction = async (id: string, data: PlayerUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await PlayerService.updatePlayer(id, data, user.id);
  const orgId = await getOrgIdBySongId(result.songId);
  revalidateSeasonBoard(orgId);
  return result;
};

export const deletePlayerAction = async (id: string) => {
  const user = await getCurrentUser();
  const existing = await PlayerRepository.getPlayerById(id);
  if (!existing) {
    throw new Error(`Player with ID ${id} does not exist.`);
  }
  const orgId = await getOrgIdBySongId(existing.songId);
  const result = await PlayerService.deletePlayer(id, user.id);
  revalidateSeasonBoard(orgId);
  return result;
};
