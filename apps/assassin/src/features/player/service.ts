import SongService from "@features/song/service";
import SongRepository from "@features/song/repository";
import { assertOrgMember } from "@features/org/service";
import {
  PlayerPayload,
  Player,
  playerSchema,
  PlayerUpdatePayload,
  updatePlayerSchema,
} from "./schema";
import PlayerRepository from "./repository";

const assertPlayerExists = async (playerId: string): Promise<Player> => {
  const player = await PlayerRepository.getPlayerById(playerId);
  const parsed = playerSchema.safeParse(player);
  if (!parsed.success) {
    throw new Error(`Player with ID ${playerId} does not exist.`);
  }
  return parsed.data;
};

const createPlayer = async (player: PlayerPayload, actorUserId: string): Promise<Player> => {
  const orgId = await SongService.assertSongAccess(player.songId, actorUserId);
  await assertOrgMember(player.userId, orgId);
  const result = await PlayerRepository.createPlayer(player);
  const parsed = playerSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }
  return parsed.data;
};

const getPlayerById = async (id: string, actorUserId: string): Promise<Player> => {
  const parsed = await assertPlayerExists(id);
  await SongService.assertSongAccess(parsed.songId, actorUserId);
  return parsed;
};

const getPlayersBySongId = async (songId: string, actorUserId: string): Promise<Player[]> => {
  await SongService.assertSongAccess(songId, actorUserId);
  const players = await PlayerRepository.getPlayersBySongId(songId);
  const parsed = playerSchema.array().safeParse(players);
  if (!parsed.success) {
    throw new Error("Invalid player responses from DB");
  }
  return parsed.data;
};

const updatePlayer = async (id: string, player: PlayerUpdatePayload, actorUserId: string) => {
  const existed = await getPlayerById(id, actorUserId);
  const parsedInput = updatePlayerSchema.safeParse(player);
  if (!parsedInput.success) {
    throw new Error("Invalid player input");
  }

  const sourceOrgId = await SongRepository.getSongOrgIdById(existed.songId);
  if (!sourceOrgId) {
    throw new Error(`Song with ID ${existed.songId} does not exist.`);
  }

  const targetSongId = parsedInput.data.songId ?? existed.songId;
  const targetOrgId =
    targetSongId === existed.songId
      ? sourceOrgId
      : await SongService.assertSongAccess(targetSongId, actorUserId);
  if (targetOrgId !== sourceOrgId) {
    throw new Error("Cross-org player move is not allowed");
  }
  const targetUserId = parsedInput.data.userId ?? existed.userId;
  await assertOrgMember(targetUserId, targetOrgId);

  const newPlayerData = {
    ...existed,
    ...parsedInput.data,
    songId: targetSongId,
    userId: targetUserId,
  };
  const updatedPlayer = await PlayerRepository.updatePlayer(id, newPlayerData);
  const parsed = playerSchema.safeParse(updatedPlayer);
  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }
  return parsed.data;
};

const deletePlayer = async (id: string, actorUserId: string) => {
  const player = await assertPlayerExists(id);
  await SongService.assertSongAccess(player.songId, actorUserId);
  await PlayerRepository.deletePlayer(id);
};

const PlayerService = {
  createPlayer,
  getPlayerById,
  getPlayersBySongId,
  updatePlayer,
  deletePlayer,
};

export default PlayerService;
