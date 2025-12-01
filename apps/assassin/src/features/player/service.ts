import SongService from "@features/song/service";
import { Player, PlayerResponse, playerResponseSchema, playerSchema } from "./schemas/player";

const assertPlayerExists = async (playerId: string): Promise<void> => {
  // const player = await playerApi.getById(playerId);
  const player = null; // TODO: replace with playerApi.getById(playerId)

  if (!player) {
    throw new Error(`Player with ID ${playerId} does not exist.`);
  }
};

const createPlayer = async (player: Player): Promise<PlayerResponse> => {
  await SongService.assertSongExists(player.songId);

  // const result = playerApi.create(player);
  const result = null; // TODO: replace with playerApi.create(player)

  const parsed = playerResponseSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }

  return parsed.data;
};

const getPlayerById = async (id: string) => {
  // const player = await playerApi.getById(id);
  const player = null; // TODO: replace with playerApi.getById(id)

  const parsed = playerResponseSchema.safeParse(player);

  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }

  return parsed.data;
};

const getPlayersBySongId = async (songId: string): Promise<Array<PlayerResponse>> => {
  await SongService.assertSongExists(songId);

  // const players = await playerApi.getBySongId(songId);
  const players: Array<unknown> = []; // TODO: replace with playerApi.getBySongId(songId)

  const parsed = playerResponseSchema.array().safeParse(players);

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

  const newPlayerData = { ...existed, ...parsedInput.data };

  // const updatedPlayer = await playerApi.update(id, newPlayerData);
  const updatedPlayer = null; // TODO: replace with playerApi.update(id, newPlayerData)

  const parsed = playerResponseSchema.safeParse(updatedPlayer);

  if (!parsed.success) {
    throw new Error("Invalid player response from DB");
  }

  return parsed.data;
};

const deletePlayer = async (id: string) => {
  await assertPlayerExists(id);

  // await playerApi.delete(id);
};

const PlayerService = {
  createPlayer,
  getPlayerById,
  getPlayersBySongId,
  updatePlayer,
  deletePlayer,
};

export default PlayerService;
