import { prisma } from "@libs/prisma/client";
import { CreateSongInput, UpdateSongInput } from "./schema";

async function getAllSongs() {
  const songs = await prisma.song.findMany({
    orderBy: { created_at: "desc" },
  });
  return songs;
}

async function getSongById(id: string) {
  const song = await prisma.song.findUnique({
    where: { id },
  });
  return song;
}

export async function createSong(input: CreateSongInput) {
  const song = await prisma.song.create({
    data: {
      name: input.name,
      artist: input.artist,
      description: input.description,
      youtube_url: input.youtubeUrl,
      order: input.order,
      writer: input.writer,
      delete_pw: input.deletePw,
      season_id: input.seasonId,
    },
  });
  return song;
}

async function updateSong(id: string, input: UpdateSongInput) {
  const song = await prisma.song.update({
    where: { id },
    data: {
      name: input.name,
      artist: input.artist,
      description: input.description,
      youtube_url: input.youtubeUrl,
      order: input.order,
      writer: input.writer,
      delete_pw: input.deletePw,
      season_id: input.seasonId,
    },
  });
  return song;
}

async function deleteSong(id: string) {
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
