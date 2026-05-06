import { prisma } from "@libs/prisma/client";
import type { Song } from "@generated/prisma/client";
import { SongPayload, SongUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getAllSongs(): Promise<Song[]> {
  const songs = await prisma.song.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return songs;
}

async function getSongById(id: string): Promise<Song | null> {
  const song = await prisma.song.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
  return song;
}

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

async function getSongOrgIdById(id: string): Promise<string | null> {
  const song = await prisma.song.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      season: {
        select: {
          orgId: true,
        },
      },
    },
  });

  return song?.season.orgId ?? null;
}

async function getSongsBySeasonId(seasonId: string): Promise<Song[]> {
  const songs = await prisma.song.findMany({
    where: {
      seasonId: seasonId,
      deletedAt: null,
    },
  });
  return songs;
}

async function getMaxSortOrderBySeasonId(
  seasonId: string,
  tx?: TransactionClient,
): Promise<bigint | number | null> {
  const prismaClient = tx || prisma;
  const result = await prismaClient.song.aggregate({
    where: {
      seasonId,
      deletedAt: null,
    },
    _max: {
      sortOrder: true,
    },
  });

  return result._max.sortOrder ?? null;
}

async function lockSeasonSongsForUpdate(seasonId: string, tx?: TransactionClient): Promise<void> {
  const prismaClient = tx || prisma;
  await prismaClient.$queryRaw`
    SELECT id
    FROM season
    WHERE id = ${seasonId}
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

async function updateSong(id: string, input: SongUpdatePayload): Promise<Song> {
  const song = await prisma.song.update({
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
  return song;
}

async function deleteSong(id: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.song.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

const SongRepository = {
  getAllSongs,
  getSongById,
  getSongByIdInOrg,
  getSongOrgIdById,
  getSongsBySeasonId,
  getMaxSortOrderBySeasonId,
  lockSeasonForUpdate: lockSeasonSongsForUpdate,
  createSong,
  updateSong,
  deleteSong,
};

export default SongRepository;
