import { prisma } from "@libs/prisma/client";
import type { Player, Profile } from "@generated/prisma/client";
import { PlayerPayload, PlayerUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

type PlayerWithProfile = Player & { profile: Profile };

async function getAllPlayers(): Promise<PlayerWithProfile[]> {
  return await prisma.player.findMany({
    where: { deletedAt: null },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
  });
}

async function getPlayerById(id: string): Promise<PlayerWithProfile | null> {
  return await prisma.player.findUnique({
    where: { id, deletedAt: null },
    include: { profile: true },
  });
}

async function getPlayersBySongId(songId: string): Promise<PlayerWithProfile[]> {
  return await prisma.player.findMany({
    where: { songId, deletedAt: null },
    include: { profile: true },
    orderBy: { createdAt: "asc" },
  });
}

async function createPlayer(input: PlayerPayload): Promise<PlayerWithProfile> {
  return await prisma.player.create({
    data: {
      userId: input.userId,
      instrument: input.instrument,
      songId: input.songId,
    },
    include: { profile: true },
  });
}

async function updatePlayer(id: string, input: PlayerUpdatePayload): Promise<PlayerWithProfile> {
  return await prisma.player.update({
    where: { id },
    data: {
      userId: input.userId,
      instrument: input.instrument,
      songId: input.songId,
    },
    include: { profile: true },
  });
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
    where: { songId },
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
