import SeasonService from "@features/season/service";
import { assertOrgMember } from "@features/org/service";
import OrgRepository from "@features/org/repository";
import SongRepository from "./repository";
import { SongPayload, Song, songSchema, SongUpdatePayload, updateSongSchema } from "./schema";
import { prisma } from "@libs/prisma/client";
import PlayerRepository from "@features/player/repository";
import CommentRepository from "@features/comment/repository";

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
      await SongRepository.lockSeasonForUpdate(song.seasonId, orgId, tx);

      const maxSortOrder = await SongRepository.getMaxSortOrderBySeasonId(song.seasonId, orgId, tx);
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

const getSongsBySeasonId = async (
  seasonId: string,
  orgId: string,
  userId: string,
): Promise<Array<Song>> => {
  await assertOrgMember(userId, orgId);
  await SeasonService.assertSeasonExists(seasonId, orgId);

  const songs = await SongRepository.getSongsBySeasonId(seasonId, orgId);

  const parsed = songSchema.array().safeParse(songs);

  if (!parsed.success) {
    throw new Error("Invalid song responses from DB");
  }

  return parsed.data;
};

const updateSong = async (id: string, orgId: string, song: SongUpdatePayload, userId: string) => {
  await assertOrgMember(userId, orgId);

  const existed = await SongRepository.getSongByIdInOrg(id, orgId);
  if (!existed) throw new Error("Song not found");

  const parsedExisted = songSchema.safeParse(existed);
  if (!parsedExisted.success) throw new Error("Invalid song data");

  const parsedInput = updateSongSchema.safeParse(song);
  if (!parsedInput.success) throw new Error("Invalid song input");

  const targetSeasonId = parsedInput.data.seasonId ?? parsedExisted.data.seasonId;
  const targetSeason = await prisma.season.findFirst({
    where: { id: targetSeasonId },
    select: { orgId: true },
  });
  if (!targetSeason?.orgId) throw new Error("Season not found");
  if (targetSeason.orgId !== orgId) throw new Error("Cross-org season move is not allowed");

  const newSongData: Song = { ...parsedExisted.data, ...parsedInput.data };

  const updatedSong = await SongRepository.updateSong(id, orgId, newSongData);

  const parsedOutput = songSchema.safeParse(updatedSong);
  if (!parsedOutput.success) throw new Error("Invalid song response from DB");

  return parsedOutput.data;
};

const deleteSong = async (id: string, orgId: string, userId: string) => {
  await assertOrgMember(userId, orgId);

  try {
    await prisma.$transaction(async (tx) => {
      await PlayerRepository.deletePlayersBySongId(id, orgId, tx);
      await CommentRepository.deleteCommentsBySongId(id, orgId, tx);
      await SongRepository.deleteSong(id, orgId, tx);
    });
  } catch (error) {
    console.error(`Failed to delete song ${id}:`, error);
    throw new Error("Song deletion failed");
  }
};

const SongService = {
  assertSongAccess,
  createSong,
  getSongByIdForUser,
  getSongByIdInOrg,
  getSongsBySeasonId,
  updateSong,
  deleteSong,
};

export default SongService;
