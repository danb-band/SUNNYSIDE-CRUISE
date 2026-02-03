"use server";

import { revalidateTag } from "next/cache";
import PlayerService from "./service";
import { PlayerPayload, PlayerUpdatePayload } from "./schema";

export const getPlayerAction = async (id: string) => {
  return await PlayerService.getPlayerById(id);
};

export const getPlayersBySongAction = async (songId: string) => {
  return await PlayerService.getPlayersBySongId(songId);
};

export const createPlayerAction = async (data: PlayerPayload) => {
  const result = await PlayerService.createPlayer(data);
  revalidateTag("players", "max");
  revalidateTag(`players:${data.songId}`, "max");
  return result;
};

export const updatePlayerAction = async (id: string, data: PlayerUpdatePayload) => {
  const result = await PlayerService.updatePlayer(id, data);
  revalidateTag("players", "max");
  return result;
};

export const deletePlayerAction = async (id: string) => {
  const result = await PlayerService.deletePlayer(id);
  revalidateTag("players", "max");
  return result;
};
