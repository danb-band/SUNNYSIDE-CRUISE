import { prisma } from "@libs/prisma/client";
import { CommentPayload, CommentUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getCommentById(id: string, orgId: string) {
  return prisma.comment.findFirst({
    where: { id, deletedAt: null, song: { season: { orgId } } },
    include: { profile: true },
  });
}

async function getCommentsBySongId(songId: string, orgId: string) {
  return prisma.comment.findMany({
    where: { songId, deletedAt: null, song: { season: { orgId } } },
    include: { profile: true },
  });
}

async function createComment(input: CommentPayload, orgId: string) {
  const song = await prisma.song.findFirst({
    where: { id: input.songId, season: { orgId }, deletedAt: null },
    select: { id: true },
  });
  if (!song) throw new Error("Song not found in org");

  return prisma.comment.create({
    data: { content: input.content, userId: input.userId, songId: input.songId },
    include: { profile: true },
  });
}

async function updateComment(id: string, orgId: string, input: CommentUpdatePayload) {
  const existing = await prisma.comment.findFirst({
    where: { id, deletedAt: null, song: { season: { orgId } } },
    select: { id: true },
  });
  if (!existing) throw new Error("Comment not found in org");

  return prisma.comment.update({
    where: { id },
    data: { content: input.content, songId: input.songId },
    include: { profile: true },
  });
}

async function softDeleteComment(id: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.updateMany({
    where: { id, deletedAt: null, song: { season: { orgId } } },
    data: { deletedAt: new Date() },
  });
}

async function getCommentsBySongIdPaginated(
  songId: string,
  orgId: string,
  limit: number,
  cursor?: string,
) {
  return prisma.comment.findMany({
    where: { songId, deletedAt: null, song: { season: { orgId } } },
    orderBy: { createdAt: "desc" },
    include: { profile: true },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

async function softDeleteCommentsBySongId(songId: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.updateMany({
    where: { songId, song: { season: { orgId } } },
    data: { deletedAt: new Date() },
  });
}

async function hardDeleteComment(id: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.deleteMany({
    where: { id, song: { season: { orgId } } },
  });
}

async function hardDeleteCommentsBySongId(songId: string, orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.deleteMany({
    where: { songId, song: { season: { orgId } } },
  });
}

async function hardDeleteCommentsBySeasonId(
  seasonId: string,
  orgId: string,
  tx?: TransactionClient,
) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.deleteMany({
    where: { song: { seasonId, season: { orgId } } },
  });
}

async function hardDeleteCommentsByOrgId(orgId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.deleteMany({
    where: { song: { season: { orgId } } },
  });
}

const CommentRepository = {
  getCommentById,
  getCommentsBySongId,
  getCommentsBySongIdPaginated,
  softDeleteCommentsBySongId,
  hardDeleteComment,
  hardDeleteCommentsBySongId,
  hardDeleteCommentsBySeasonId,
  hardDeleteCommentsByOrgId,
  createComment,
  updateComment,
  softDeleteComment,
};

export default CommentRepository;
