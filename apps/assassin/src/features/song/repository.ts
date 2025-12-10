import { prisma } from "@libs/prisma/client";
import type { Song } from "../../generated/prisma/client";
import { CreateSongInput, UpdateSongInput } from "./schema";

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

export async function createSong(input: CreateSongInput): Promise<Song> {
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

async function deleteSong(id: string): Promise<void> {
  await prisma.song.delete({
    where: { id },
  });
}

const SongRepository = {
  getAllSongs,
  getSongById,
  createSong,
  updateSong,
  deleteSong,
};

export default SongRepository;
