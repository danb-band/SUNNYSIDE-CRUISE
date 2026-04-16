"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import PlayerService from "./service";
import { PlayerPayload, PlayerUpdatePayload } from "./schema";

export const getPlayerAction = async (id: string) => {
  const user = await getCurrentUser();
  return await PlayerService.getPlayerById(id, user.id);
};

export const getPlayersBySongAction = async (songId: string) => {
  const user = await getCurrentUser();
  return await PlayerService.getPlayersBySongId(songId, user.id);
};

export const createPlayerAction = async (data: PlayerPayload, orgId: string) => {
  const user = await getCurrentUser();
  const result = await PlayerService.createPlayer(data, user.id);
  revalidateSeasonBoard(orgId);
  return result;
};

export const updatePlayerAction = async (id: string, orgId: string, data: PlayerUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await PlayerService.updatePlayer(id, data, user.id);
  revalidateSeasonBoard(orgId);
  return result;
};

export const deletePlayerAction = async (id: string, songId: string, orgId: string) => {
  const user = await getCurrentUser();
  const result = await PlayerService.deletePlayer(id, user.id);
  revalidateSeasonBoard(orgId);
  return result;
};
