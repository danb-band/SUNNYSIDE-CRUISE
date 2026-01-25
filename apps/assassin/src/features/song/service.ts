import SeasonService from "@features/season/service";
import SongRepository from "./repository";
import { SongPayload, Song, songSchema, SongUpdatePayload, updateSongSchema } from "./schema";
import { prisma } from "@libs/prisma/client";
import PlayerRepository from "@features/player/repository";
import CommentRepository from "@features/comment/repository";
import { hashPassword, verifyPassword } from "@libs/utils/password";

const assertSongExists = async (songId: string): Promise<void> => {
  const song = await SongRepository.getSongById(songId);

  const parsed = songSchema.safeParse(song);

  if (!parsed.success) {
    throw new Error(`Song with ID ${songId} does not exist.`);
  }
};

const createSong = async (song: SongPayload) => {
  await SeasonService.assertSeasonExists(song.seasonId);

  const input: SongPayload = {
    ...song,
    password: hashPassword(song.password),
  };

  const result = await SongRepository.createSong(input);

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

const updateSong = async (id: string, song: SongUpdatePayload, pw: string) => {
  const existed = await getSongById(id);

  if (!existed.password) {
    throw new Error("Song password is not set");
  }

  const isValid = verifyPassword(pw, existed.password);

  if (!isValid) {
    throw new Error("Invalid password");
  }

  const parsedInput = updateSongSchema.safeParse(song);

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

const deleteSong = async (id: string, pw: string) => {
  const song = await SongRepository.getSongById(id);

  if (!song) {
    throw new Error(`Song with ID ${id} does not exist.`);
  }

  if (!song.password) {
    throw new Error("Song password is not set");
  }

  const isValid = verifyPassword(pw, song.password);
  if (!isValid) {
    throw new Error("Invalid password");
  }

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
