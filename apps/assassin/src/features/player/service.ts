import SongService from "@features/song/service";
import { Player, playerSchema } from "./schema";
import PlayerRepository from "./repository";

const assertPlayerExists = async (playerId: string): Promise<void> => {
  const player = await PlayerRepository.getPlayerById(playerId);

  const parsed = playerSchema.safeParse(player);

  if (!parsed.success) {
    throw new Error(`Player with ID ${playerId} does not exist.`);
  }
};

const createPlayer = async (player: Player): Promise<Player> => {
  await SongService.assertSongExists(player.songId);

  const result = await PlayerRepository.createPlayer(player);

  const parsed = playerSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }

  return parsed.data;
};

const getPlayerById = async (id: string): Promise<Player> => {
  const player = await PlayerRepository.getPlayerById(id);

  const parsed = playerSchema.safeParse(player);

  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }

  return parsed.data;
};

const getPlayersBySongId = async (songId: string): Promise<Array<Player>> => {
  await SongService.assertSongExists(songId);

  const players = await PlayerRepository.getPlayersBySongId(songId);

  const parsed = playerSchema.array().safeParse(players);

  if (!parsed.success) {
    throw new Error("Invalid player responses from DB");
  }

  return parsed.data;
};

const updatePlayer = async (id: string, player: Partial<Player>) => {
  const existed = await getPlayerById(id);

  const parsedInput = playerSchema.partial().safeParse(player);

  if (!parsedInput.success) {
    throw new Error("Invalid player input");
  }

  const newPlayerData: Player = { ...existed, ...parsedInput.data };

  const updatedPlayer = await PlayerRepository.updatePlayer(id, newPlayerData);

  const parsed = playerSchema.safeParse(updatedPlayer);

  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }

  return parsed.data;
};

const deletePlayer = async (id: string) => {
  await assertPlayerExists(id);
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
