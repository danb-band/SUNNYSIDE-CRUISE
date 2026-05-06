import SeasonService from "@features/season/service";
import { assertOrgMember } from "@features/org/service";
import OrgRepository from "@features/org/repository";
import SongRepository from "./repository";
import { SongPayload, Song, songSchema, SongUpdatePayload, updateSongSchema } from "./schema";
import { prisma } from "@libs/prisma/client";
import PlayerRepository from "@features/player/repository";
import CommentRepository from "@features/comment/repository";
import { z } from "zod";

const assertSongExists = async (songId: string): Promise<void> => {
  const song = await SongRepository.getSongById(songId);

  if (!song) {
    throw new Error(`Song with ID ${songId} does not exist.`);
  }

  const parsed = songSchema.safeParse(song);

  if (!parsed.success) {
    throw new Error(`Invalid song response from DB for ID ${songId}.`);
  }
};

const assertSongAccess = async (songId: string, userId: string): Promise<string> => {
  const orgId = await OrgRepository.getOrgIdBySongId(songId);
  if (!orgId) {
    throw new Error(`Song with ID ${songId} does not exist.`);
  }
  await assertOrgMember(userId, orgId);
  return orgId;
};

const getSongByIdForUser = async (id: string, userId: string): Promise<Song | null> => {
  const orgId = await OrgRepository.getOrgIdBySongId(id);
  if (!orgId) return null;

  try {
    await assertOrgMember(userId, orgId);
  } catch {
    return null;
  }

  const song = await SongRepository.getSongByIdInOrg(id, orgId);
  if (!song) return null;

  const parsed = songSchema.safeParse(song);
  if (!parsed.success) {
    throw new Error("Invalid song response from DB");
  }

  return parsed.data;
};

const getSongByIdInOrg = async (
  id: string,
  orgId: string,
  userId: string,
): Promise<Song | null> => {
  await assertOrgMember(userId, orgId);

  const song = await SongRepository.getSongByIdInOrg(id, orgId);
  if (!song) return null;

  const parsed = songSchema.safeParse(song);
  if (!parsed.success) {
    throw new Error("Invalid song response from DB");
  }

  return parsed.data;
};

const createSong = async (song: SongPayload, orgId: string) => {
  await assertOrgMember(song.userId, orgId);
  await SeasonService.assertSeasonExists(song.seasonId, orgId);

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      await SongRepository.lockSeasonForUpdate(song.seasonId, tx);

      const maxSortOrder = await SongRepository.getMaxSortOrderBySeasonId(song.seasonId, tx);
      const nextSortOrder = (maxSortOrder ? Number(maxSortOrder) : 0) + 1;

      return await SongRepository.createSong(
        {
          ...song,
          sortOrder: nextSortOrder,
        },
        tx,
      );
    });
  } catch (error) {
    console.error("Failed to create song:", error);
    throw new Error("Song creation failed");
  }

  if (!result) {
    throw new Error("Song creation failed");
  }

  const parsed = songSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid song response from DB");
  }

  return parsed.data;
};

const getSongById = async (id: string): Promise<Song | null> => {
  const song = await SongRepository.getSongById(id);

  if (!song) return null;

  const parsed = songSchema.safeParse(song);

  if (!parsed.success) {
    throw new Error("Invalid song response from DB");
  }

  return parsed.data;
};

const getSongsBySeasonId = async (
  seasonId: string,
  orgId: string,
  userId: string,
): Promise<Array<Song>> => {
  await assertOrgMember(userId, orgId);
  await SeasonService.assertSeasonExists(seasonId, orgId);

  const songs = await SongRepository.getSongsBySeasonId(seasonId);

  const parsed = songSchema.array().safeParse(songs);

  if (!parsed.success) {
    throw new Error("Invalid song responses from DB");
  }

  return parsed.data;
};

const updateSong = async (id: string, song: SongUpdatePayload, userId: string) => {
  const existed = await getSongById(id);

  if (!existed) {
    throw new Error(`Song with ID ${id} does not exist.`);
  }

  const sourceOrgId = await assertSongAccess(id, userId);

  const parsedInput = updateSongSchema.safeParse(song);

  if (!parsedInput.success) {
    throw new Error("Invalid song input");
  }

  const targetSeasonId = parsedInput.data.seasonId ?? existed.seasonId;
  const targetSeasonOrgId = await OrgRepository.getOrgIdBySeasonId(targetSeasonId);
  const parsedTargetSeasonOrg = z
    .object({
      orgId: z.uuid(),
    })
    .safeParse({ orgId: targetSeasonOrgId });
  if (!parsedTargetSeasonOrg.success) {
    throw new Error("Season not found");
  }
  if (parsedTargetSeasonOrg.data.orgId !== sourceOrgId) {
    throw new Error("Cross-org season move is not allowed");
  }
  await assertOrgMember(userId, parsedTargetSeasonOrg.data.orgId);

  const newSongData: Song = { ...existed, ...parsedInput.data };

  const updatedSong = await SongRepository.updateSong(id, newSongData);

  const parsedOutput = songSchema.safeParse(updatedSong);

  if (!parsedOutput.success) {
    throw new Error("Invalid song response from DB");
  }

  return parsedOutput.data;
};

const deleteSong = async (id: string, userId: string) => {
  const song = await SongRepository.getSongById(id);

  if (!song) {
    throw new Error(`Song with ID ${id} does not exist.`);
  }

  await assertSongAccess(id, userId);

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
  assertSongAccess,
  createSong,
  getSongById,
  getSongByIdForUser,
  getSongByIdInOrg,
  getSongsBySeasonId,
  updateSong,
  deleteSong,
};

export default SongService;
