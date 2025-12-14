import { prisma } from "@libs/prisma/client";
import type { PrismaClient, Song } from "@generated/prisma/client";
import { CreateSongInput, UpdateSongInput } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getAllSongs(): Promise<Song[]> {
  const songs = await prisma.song.findMany({
    orderBy: { created_at: "desc" },
  });
  return songs;
}

async function getSongById(id: string): Promise<Song | null> {
  const song = await prisma.song.findUnique({
    where: { id },
  });
  return song;
}

async function getSongsBySeasonId(seasonId: string): Promise<Song[]> {
  const songs = await prisma.song.findMany({
    where: { season_id: seasonId },
  });
  return songs;
}

async function createSong(input: CreateSongInput): Promise<Song> {
  const song = await prisma.song.create({
    data: {
      name: input.name,
      artist: input.artist,
      description: input.description,
      youtube_url: input.youtubeUrl,
      sort_order: input.sortOrder,
      writer: input.writer,
      delete_pw: input.deletePw,
      season_id: input.seasonId,
    },
  });
  return song;
}

async function updateSong(id: string, input: UpdateSongInput): Promise<Song> {
  const song = await prisma.song.update({
    where: { id },
    data: {
      name: input.name,
      artist: input.artist,
      description: input.description,
      youtube_url: input.youtubeUrl,
      sort_order: input.sortOrder,
      writer: input.writer,
      delete_pw: input.deletePw,
      season_id: input.seasonId,
    },
  });
  return song;
}

async function deleteSong(id: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.song.delete({
    where: { id },
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
