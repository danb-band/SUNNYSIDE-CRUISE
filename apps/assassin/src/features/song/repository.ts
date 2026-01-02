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
  const song = await prisma.song.findUnique({
    where: {
      id,
      deletedAt: null,
    },
  });
  return song;
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

async function createSong(input: SongPayload): Promise<Song> {
  const song = await prisma.song.create({
    data: {
      name: input.name,
      artist: input.artist,
      description: input.description,
      youtubeUrl: input.youtubeUrl,
      sortOrder: input.sortOrder,
      writer: input.writer,
      deletePw: input.deletePw,
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
      writer: input.writer,
      deletePw: input.deletePw,
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
  getSongsBySeasonId,
  createSong,
  updateSong,
  deleteSong,
};

export default SongRepository;
