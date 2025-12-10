import { prisma } from "@libs/prisma/client";
import type { Player } from "@generated/prisma/client";
import { CreatePlayerInput, UpdatePlayerInput } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getAllPlayers(): Promise<Player[]> {
  const players = await prisma.player.findMany({
    orderBy: { created_at: "desc" },
  });
  return players;
}

async function getPlayerById(id: string): Promise<Player | null> {
  const player = await prisma.player.findUnique({
    where: { id },
  });
  return player;
}

async function getPlayersBySongId(songId: string): Promise<Player[]> {
  const players = await prisma.player.findMany({
    where: { song_id: songId },
  });
  return players;
}

async function createPlayer(input: CreatePlayerInput): Promise<Player> {
  const player = await prisma.player.create({
    data: {
      name: input.name,
      instrument: input.instrument,
      song_id: input.songId,
    },
  });
  return player;
}

async function updatePlayer(id: string, input: UpdatePlayerInput): Promise<Player> {
  const player = await prisma.player.update({
    where: { id },
    data: {
      name: input.name,
      instrument: input.instrument,
      song_id: input.songId,
    },
  });
  return player;
}

async function deletePlayer(id: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.player.delete({
    where: { id },
  });
}

async function deletePlayersBySongId(songId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.player.deleteMany({
    where: { song_id: songId },
  });
}

const PlayerRepository = {
  getAllPlayers,
  getPlayerById,
  getPlayersBySongId,
  createPlayer,
  updatePlayer,
  deletePlayer,
  deletePlayersBySongId,
};

export default PlayerRepository;
