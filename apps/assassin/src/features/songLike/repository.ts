import { TransactionClient } from "@/libs/prisma/types";
import { prisma } from "@libs/prisma/client";

async function getLikeBySongAndUser(songId: string, userId: string) {
  return prisma.songLike.findUnique({
    where: { songId_userId: { songId, userId } },
  });
}

async function createLike(songId: string, userId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;

  return prismaClient.songLike.create({
    data: { songId, userId },
  });
}

async function deleteLike(songId: string, userId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;

  return prismaClient.songLike.delete({
    where: { songId_userId: { songId, userId } },
  });
}

const SongLikeRepository = {
  getLikeBySongAndUser,
  createLike,
  deleteLike,
};

export default SongLikeRepository;
