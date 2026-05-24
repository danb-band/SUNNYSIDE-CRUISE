import { assertOrgMember } from "@features/org/service";
import SongRepository from "@features/song/repository";
import {
  PlayerPayload,
  Player,
  playerSchema,
  PlayerUpdatePayload,
  updatePlayerSchema,
} from "./schema";
import PlayerRepository from "./repository";

const createPlayer = async (
  player: PlayerPayload,
  orgId: string,
  actorUserId: string,
): Promise<Player> => {
  await assertOrgMember(actorUserId, orgId);
  await assertOrgMember(player.userId, orgId);
  const result = await PlayerRepository.createPlayer(player, orgId);
  const parsed = playerSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }
  return parsed.data;
};

const getPlayerById = async (id: string, orgId: string, actorUserId: string): Promise<Player> => {
  await assertOrgMember(actorUserId, orgId);
  const player = await PlayerRepository.getPlayerById(id, orgId);
  const parsed = playerSchema.safeParse(player);
  if (!parsed.success) {
    throw new Error(`Player with ID ${id} does not exist.`);
  }
  return parsed.data;
};

const getPlayersBySongId = async (
  songId: string,
  orgId: string,
  actorUserId: string,
): Promise<Player[]> => {
  await assertOrgMember(actorUserId, orgId);
  const players = await PlayerRepository.getPlayersBySongId(songId, orgId);
  const parsed = playerSchema.array().safeParse(players);
  if (!parsed.success) {
    throw new Error("Invalid player responses from DB");
  }
  return parsed.data;
};

const updatePlayer = async (
  id: string,
  orgId: string,
  player: PlayerUpdatePayload,
  actorUserId: string,
) => {
  await assertOrgMember(actorUserId, orgId);

  const existed = await PlayerRepository.getPlayerById(id, orgId);
  const parsedExisted = playerSchema.safeParse(existed);
  if (!parsedExisted.success) {
    throw new Error(`Player with ID ${id} does not exist.`);
  }

  const parsedInput = updatePlayerSchema.safeParse(player);
  if (!parsedInput.success) {
    throw new Error("Invalid player input");
  }

  if (parsedInput.data.songId && parsedInput.data.songId !== parsedExisted.data.songId) {
    const targetSong = await SongRepository.getSongByIdInOrg(parsedInput.data.songId, orgId);
    if (!targetSong) throw new Error("Cross-org player move is not allowed");
  }

  const targetUserId = parsedInput.data.userId ?? parsedExisted.data.userId;
  if (targetUserId !== parsedExisted.data.userId) {
    await assertOrgMember(targetUserId, orgId);
  }

  const newPlayerData = { ...parsedExisted.data, ...parsedInput.data };
  const updatedPlayer = await PlayerRepository.updatePlayer(id, orgId, newPlayerData);
  const parsed = playerSchema.safeParse(updatedPlayer);
  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }
  return parsed.data;
};

const softDeletePlayer = async (id: string, orgId: string, actorUserId: string) => {
  await assertOrgMember(actorUserId, orgId);
  const player = await PlayerRepository.getPlayerById(id, orgId);
  if (!playerSchema.safeParse(player).success) {
    throw new Error(`Player with ID ${id} does not exist.`);
  }
  await PlayerRepository.softDeletePlayer(id, orgId);
};

const PlayerService = {
  createPlayer,
  getPlayerById,
  getPlayersBySongId,
  updatePlayer,
  softDeletePlayer,
};

export default PlayerService;
