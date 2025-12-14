import SeasonService from "@features/season/service";
import SongRepository from "./repository";
import { Song, songSchema } from "./schema";
import { prisma } from "@libs/prisma/client";
import PlayerRepository from "@features/player/repository";
import CommentRepository from "@features/comment/repository";

const assertSongExists = async (songId: string): Promise<void> => {
  const song = await SongRepository.getSongById(songId);

  const parsed = songSchema.safeParse(song);

  if (!parsed.success) {
    throw new Error(`Song with ID ${songId} does not exist.`);
  }
};

const createSong = async (song: Song) => {
  await SeasonService.assertSeasonExists(song.seasonId);

  const result = await SongRepository.createSong(song);

  const parsed = songSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid song response from DB");
  }

  return parsed.data;
};

const getSongById = async (id: string): Promise<Song> => {
  const song = await SongRepository.getSongById(id);

  const parsed = songSchema.safeParse(song);

  if (!parsed.success) {
    throw new Error("Invalid song response from DB");
  }

  return parsed.data;
};

const getSongsBySeasonId = async (seasonId: string): Promise<Array<Song>> => {
  await SeasonService.assertSeasonExists(seasonId);

  const songs = await SongRepository.getSongsBySeasonId(seasonId);

  const parsed = songSchema.array().safeParse(songs);

  if (!parsed.success) {
    throw new Error("Invalid song responses from DB");
  }

  return parsed.data;
};

const updateSong = async (id: string, song: Partial<Song>) => {
  const existed = await getSongById(id);

  const parsedInput = songSchema.partial().safeParse(song);

  if (!parsedInput.success) {
    throw new Error("Invalid song input");
  }

  const newSongData: Song = { ...existed, ...parsedInput.data };

  const updatedSong = await SongRepository.updateSong(id, newSongData);

  const parsedOutput = songSchema.safeParse(updatedSong);

  if (!parsedOutput.success) {
    throw new Error("Invalid song response from DB");
  }

  return parsedOutput.data;
};

const deleteSong = async (id: string) => {
  await assertSongExists(id);

  try {
    await prisma.$transaction(async (tx) => {
      await PlayerRepository.deletePlayersBySongId(id, tx);
      await CommentRepository.deleteCommentsBySongId(id, tx);
      await SongRepository.deleteSong(id, tx);
    });
  } catch (error) {
    console.error(`Failed to delete song ${id}:`, error);
    throw new Error("Song deletion failed");
  }
};

const SongService = {
  assertSongExists,
  createSong,
  getSongById,
  getSongsBySeasonId,
  updateSong,
  deleteSong,
};

export default SongService;
