import { prisma } from "@libs/prisma/client";
import { CommentPayload, CommentUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getAllComments() {
  const comments = await prisma.comment.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { profile: true },
  });
  return comments;
}

async function getCommentById(id: string) {
  const comment = await prisma.comment.findUnique({
    where: {
      id,
      deletedAt: null,
    },
    include: { profile: true },
  });
  return comment;
}

async function getCommentsBySongId(songId: string) {
  const comments = await prisma.comment.findMany({
    where: {
      songId: songId,
      deletedAt: null,
    },
    include: { profile: true },
  });
  return comments;
}

async function createComment(input: CommentPayload) {
  const comment = await prisma.comment.create({
    data: {
      content: input.content,
      userId: input.userId,
      songId: input.songId,
    },
    include: { profile: true },
  });
  return comment;
}

async function updateComment(id: string, input: CommentUpdatePayload) {
  const comment = await prisma.comment.update({
    where: { id },
    data: {
      content: input.content,
      songId: input.songId,
    },
    include: { profile: true },
  });
  return comment;
}

async function deleteComment(id: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

async function getCommentsBySongIdPaginated(songId: string, limit: number, cursor?: string) {
  return await prisma.comment.findMany({
    where: {
      songId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: { profile: true },
    // 1개 더 조회해서 다음 페이지 존재 여부를 서비스에서 판단할 수 있게 함
    take: limit + 1,
    ...(cursor
      ? {
          // cursor 항목은 이전 페이지 마지막이므로 건너뜀
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  });
}

async function deleteCommentsBySongId(songId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.updateMany({
    where: { songId: songId },
    data: { deletedAt: new Date() },
  });
}

const CommentRepository = {
  getAllComments,
  getCommentById,
  getCommentsBySongId,
  getCommentsBySongIdPaginated,
  deleteCommentsBySongId,
  createComment,
  updateComment,
  deleteComment,
};

export default CommentRepository;
