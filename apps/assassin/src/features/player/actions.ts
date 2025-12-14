"use server";

import PlayerService from "./service";
import { PlayerPayload, PlayerUpdatePayload } from "./schema";

export const getPlayersAction = async () => {
  return await PlayerService.getAllPlayers();
};

export const getPlayerAction = async (id: string) => {
  return await PlayerService.getPlayerById(id);
};

export const getPlayersBySongAction = async (songId: string) => {
  return await PlayerService.getPlayersBySongId(songId);
};

export const createPlayerAction = async (data: PlayerPayload) => {
  return await PlayerService.createPlayer(data);
};

export const updatePlayerAction = async (id: string, data: PlayerUpdatePayload) => {
  return await PlayerService.updatePlayer(id, data);
};

export const deletePlayerAction = async (id: string) => {
  return await PlayerService.deletePlayer(id);
};
