import { prisma } from "@libs/prisma/client";
import type { Song } from "@generated/prisma/client";
import { SongPayload, SongUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getSongByIdInOrg(id: string, orgId: string): Promise<Song | null> {
  return await prisma.song.findFirst({
    where: {
      id,
      deletedAt: null,
      season: {
        orgId,
      },
    },
  });
}

async function getSongsBySeasonId(seasonId: string, orgId: string): Promise<Song[]> {
  const songs = await prisma.song.findMany({
    where: {
      seasonId,
      deletedAt: null,
      season: { orgId },
    },
  });
  return songs;
}

async function getMaxSortOrderBySeasonId(
  seasonId: string,
  orgId: string,
  tx?: TransactionClient,
): Promise<bigint | number | null> {
  const prismaClient = tx || prisma;
  const result = await prismaClient.song.aggregate({
    where: {
      seasonId,
      deletedAt: null,
      season: { orgId },
    },
    _max: {
      sortOrder: true,
    },
  });

  return result._max.sortOrder ?? null;
}

async function lockSeasonSongsForUpdate(
  seasonId: string,
  orgId: string,
  tx?: TransactionClient,
): Promise<void> {
  const prismaClient = tx || prisma;
  await prismaClient.$queryRaw`
    SELECT id
    FROM season
    WHERE id = ${seasonId}
    AND "orgId" = ${orgId}
    FOR UPDATE
  `;
}

async function createSong(input: SongPayload, tx?: TransactionClient): Promise<Song> {
  const prismaClient = tx || prisma;
  const song = await prismaClient.song.create({
    data: {
      name: input.name,
      artist: input.artist,
      description: input.description,
      youtubeUrl: input.youtubeUrl,
      sortOrder: input.sortOrder,
      userId: input.userId,
      seasonId: input.seasonId,
    },
  });
  return song;
}

async function updateSong(id: string, orgId: string, input: SongUpdatePayload): Promise<Song> {
  const existing = await prisma.song.findFirst({
    where: { id, season: { orgId }, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new Error("Song not found in org");

  return prisma.song.update({
    where: { id },
    data: {
      name: input.name,
      artist: input.artist,
      description: input.description,
      youtubeUrl: input.youtubeUrl,
      sortOrder: input.sortOrder,
      seasonId: input.seasonId,
    },
  });
}

async function softDeleteSong(id: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.song.updateMany({
    where: { id, season: { orgId }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

async function hardDeleteSong(id: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.song.deleteMany({
    where: { id, season: { orgId } },
  });
}

async function hardDeleteSongsBySeasonId(
  seasonId: string,
  orgId: string,
  tx?: TransactionClient,
) {
  const prismaClient = tx || prisma;
  await prismaClient.song.deleteMany({
    where: { seasonId, season: { orgId } },
  });
}

async function hardDeleteSongsByOrgId(orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.song.deleteMany({
    where: { season: { orgId } },
  });
}

const SongRepository = {
  getSongByIdInOrg,
  getSongsBySeasonId,
  getMaxSortOrderBySeasonId,
  lockSeasonForUpdate: lockSeasonSongsForUpdate,
  createSong,
  updateSong,
  softDeleteSong,
  hardDeleteSong,
  hardDeleteSongsBySeasonId,
  hardDeleteSongsByOrgId,
};

export default SongRepository;
