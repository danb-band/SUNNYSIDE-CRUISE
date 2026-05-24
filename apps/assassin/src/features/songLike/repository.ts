import { TransactionClient } from "@/libs/prisma/types";
import { prisma } from "@libs/prisma/client";

async function getLikeBySongAndUser(songId: string, userId: string, orgId: string) {
  return prisma.songLike.findFirst({
    where: { songId, userId, song: { season: { orgId }, deletedAt: null } },
  });
}

async function createLike(songId: string, userId: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;

  const song = await prismaClient.song.findFirst({
    where: { id: songId, season: { orgId }, deletedAt: null },
    select: { id: true },
  });
  if (!song) throw new Error("Song not found in org");

  return prismaClient.songLike.create({
    data: { songId, userId },
  });
}

async function deleteLike(songId: string, userId: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;

  return prismaClient.songLike.deleteMany({
    where: { songId, userId, song: { season: { orgId }, deletedAt: null } },
  });
}

const SongLikeRepository = {
  getLikeBySongAndUser,
  createLike,
  deleteLike,
};

export default SongLikeRepository;
