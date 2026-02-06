"use server";

import { revalidatePath } from "next/cache";
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
  revalidatePath(`/song/${data.songId}`);
  return result;
};

export const updatePlayerAction = async (id: string, data: PlayerUpdatePayload) => {
  const result = await PlayerService.updatePlayer(id, data);
  revalidatePath(`/song/${data.songId}`);
  return result;
};

export const deletePlayerAction = async (id: string, songId: string) => {
  const result = await PlayerService.deletePlayer(id);
  revalidatePath(`/song/${songId}`);
  return result;
};
