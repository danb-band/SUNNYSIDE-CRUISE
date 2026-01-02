import { prisma } from "@libs/prisma/client";
import type { Comment } from "@generated/prisma/client";
import { CommentPayload, CommentUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getAllComments(): Promise<Comment[]> {
  const comments = await prisma.comment.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return comments;
}

async function getCommentById(id: string): Promise<Comment | null> {
  const comment = await prisma.comment.findUnique({
    where: {
      id,
      deletedAt: null,
    },
  });
  return comment;
}

async function getCommentsBySongId(songId: string): Promise<Comment[]> {
  const comments = await prisma.comment.findMany({
    where: {
      songId: songId,
      deletedAt: null,
    },
  });
  return comments;
}

async function createComment(input: CommentPayload): Promise<Comment> {
  const comment = await prisma.comment.create({
    data: {
      content: input.content,
      writer: input.writer,
      deletePw: input.deletePw,
      songId: input.songId,
    },
  });
  return comment;
}

async function updateComment(id: string, input: CommentUpdatePayload): Promise<Comment> {
  const comment = await prisma.comment.update({
    where: { id },
    data: {
      content: input.content,
      writer: input.writer,
      deletePw: input.deletePw,
      songId: input.songId,
    },
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
  deleteCommentsBySongId,
  createComment,
  updateComment,
  deleteComment,
};

export default CommentRepository;
