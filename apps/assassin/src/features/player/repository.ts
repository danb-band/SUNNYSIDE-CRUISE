import { prisma } from "@libs/prisma/client";
import type { Player, Profile } from "@generated/prisma/client";
import { PlayerPayload, PlayerUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

type PlayerWithProfile = Player & { profile: Profile };

async function getPlayerById(id: string, orgId: string): Promise<PlayerWithProfile | null> {
  return prisma.player.findFirst({
    where: { id, deletedAt: null, song: { season: { orgId } } },
    include: { profile: true },
  });
}

async function getPlayersBySongId(songId: string, orgId: string): Promise<PlayerWithProfile[]> {
  return prisma.player.findMany({
    where: { songId, deletedAt: null, song: { season: { orgId } } },
    include: { profile: true },
    orderBy: { createdAt: "asc" },
  });
}

async function createPlayer(input: PlayerPayload, orgId: string): Promise<PlayerWithProfile> {
  const song = await prisma.song.findFirst({
    where: { id: input.songId, season: { orgId }, deletedAt: null },
    select: { id: true },
  });
  if (!song) throw new Error("Song not found in org");

  return prisma.player.create({
    data: { userId: input.userId, instrument: input.instrument, songId: input.songId },
    include: { profile: true },
  });
}

async function updatePlayer(
  id: string,
  orgId: string,
  input: PlayerUpdatePayload,
): Promise<PlayerWithProfile> {
  const existing = await prisma.player.findFirst({
    where: { id, deletedAt: null, song: { season: { orgId } } },
    select: { id: true },
  });
  if (!existing) throw new Error("Player not found in org");

  return prisma.player.update({
    where: { id },
    data: { userId: input.userId, instrument: input.instrument, songId: input.songId },
    include: { profile: true },
  });
}

async function deletePlayer(id: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.player.updateMany({
    where: { id, deletedAt: null, song: { season: { orgId } } },
    data: { deletedAt: new Date() },
  });
}

async function deletePlayersBySongId(songId: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.player.updateMany({
    where: { songId, song: { season: { orgId } } },
    data: { deletedAt: new Date() },
  });
}

const PlayerRepository = {
  getPlayerById,
  getPlayersBySongId,
  createPlayer,
  updatePlayer,
  deletePlayer,
  deletePlayersBySongId,
};

export default PlayerRepository;
