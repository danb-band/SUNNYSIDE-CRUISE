import { prisma } from "@libs/prisma/client";
import type { Comment, PrismaClient } from "@generated/prisma/client";
import { CreateCommentInput, UpdateCommentInput } from "./schema";
import { TransactionClient } from "@generated/prisma/internal/prismaNamespaceBrowser";

async function getAllComments(): Promise<Comment[]> {
  const comments = await prisma.comment.findMany({
    orderBy: { created_at: "desc" },
  });
  return comments;
}

async function getCommentById(id: string): Promise<Comment | null> {
  const comment = await prisma.comment.findUnique({
    where: { id },
  });
  return comment;
}

async function getCommentsBySongId(songId: string): Promise<Comment[]> {
  const comments = await prisma.comment.findMany({
    where: { song_id: songId },
  });
  return comments;
}

async function createComment(input: CreateCommentInput): Promise<Comment> {
  const comment = await prisma.comment.create({
    data: {
      content: input.content,
      writer: input.writer,
      delete_pw: input.deletePw,
      song_id: input.songId,
    },
  });
  return comment;
}

async function updateComment(id: string, input: UpdateCommentInput): Promise<Comment> {
  const comment = await prisma.comment.update({
    where: { id },
    data: {
      content: input.content,
      writer: input.writer,
      delete_pw: input.deletePw,
      song_id: input.songId,
    },
  });
  return comment;
}

async function deleteComment(id: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.delete({
    where: { id },
  });
}

async function deleteCommentsBySongId(songId: string, tx?: TransactionClient) {
  const prismaClient = tx || prisma;
  await prismaClient.comment.deleteMany({
    where: { song_id: songId },
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
