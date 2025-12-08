import { prisma } from "@libs/prisma/client";
import { CreateCommentInput, UpdateCommentInput } from "./schema";

async function getAllComments() {
  const comments = await prisma.comment.findMany({
    orderBy: { created_at: "desc" },
  });
  return comments;
}

async function getCommentById(id: string) {
  const comment = await prisma.comment.findUnique({
    where: { id },
  });
  return comment;
}

async function getCommentsBySongId(songId: string) {
  const comments = await prisma.comment.findMany({
    where: { song_id: songId },
  });
  return comments;
}

async function createComment(input: CreateCommentInput) {
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

async function updateComment(id: string, input: UpdateCommentInput) {
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

async function deleteComment(id: string) {
  await prisma.comment.delete({
    where: { id },
  });
}

const CommentRepository = {
  getAllComments,
  getCommentById,
  getCommentsBySongId,
  createComment,
  updateComment,
  deleteComment,
};

export default CommentRepository;
