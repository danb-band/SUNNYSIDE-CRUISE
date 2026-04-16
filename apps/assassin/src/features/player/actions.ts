"use server";

import { revalidatePath } from "next/cache";
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

export const createPlayerAction = async (data: PlayerPayload) => {
  const user = await getCurrentUser();
  const result = await PlayerService.createPlayer(data, user.id);
  revalidatePath(`/song/${data.songId}`);
  return result;
};

export const updatePlayerAction = async (id: string, data: PlayerUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await PlayerService.updatePlayer(id, data, user.id);
  revalidatePath(`/song/${data.songId}`);
  return result;
};

export const deletePlayerAction = async (id: string, songId: string) => {
  const user = await getCurrentUser();
  const result = await PlayerService.deletePlayer(id, user.id);
  revalidatePath(`/song/${songId}`);
  return result;
};
