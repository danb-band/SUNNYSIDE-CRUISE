import { prisma } from "@libs/prisma/client";
import type { Player } from "@generated/prisma/client";
import { PlayerPayload, PlayerUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getAllPlayers(): Promise<Player[]> {
  const players = await prisma.player.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return players;
}

async function getPlayerById(id: string): Promise<Player | null> {
  const player = await prisma.player.findUnique({
    where: {
      id,
      deletedAt: null,
    },
  });
  return player;
}

async function getPlayersBySongId(songId: string): Promise<Player[]> {
  const players = await prisma.player.findMany({
    where: {
      songId: songId,
      deletedAt: null,
    },
  });
  return players;
}

async function createPlayer(input: PlayerPayload): Promise<Player> {
  const player = await prisma.player.create({
    data: {
      name: input.name,
      instrument: input.instrument,
      songId: input.songId,
    },
  });
  return player;
}

async function updatePlayer(id: string, input: PlayerUpdatePayload): Promise<Player> {
  const player = await prisma.player.update({
    where: { id },
    data: {
      name: input.name,
      instrument: input.instrument,
      songId: input.songId,
    },
  });
  return player;
}

async function deletePlayer(id: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.player.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

async function deletePlayersBySongId(songId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.player.updateMany({
    where: { songId: songId },
    data: { deletedAt: new Date() },
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
