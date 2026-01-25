import SongService from "@features/song/service";
import CommentRepository from "./repository";
import {
  Comment,
  commentSchema,
  CommentPayload,
  CommentUpdatePayload,
  updateCommentSchema,
} from "./schema";
import { hashPassword, verifyPassword } from "@libs/utils/password";

const assertCommentExists = async (commentId: string): Promise<void> => {
  const comment = await CommentRepository.getCommentById(commentId);

  const parsed = commentSchema.safeParse(comment);

  if (!parsed.success) {
    throw new Error(`Comment with ID ${commentId} does not exist.`);
  }
};

const createComment = async (comment: CommentPayload): Promise<Comment> => {
  await SongService.assertSongExists(comment.songId);

  const input: CommentPayload = {
    ...comment,
    password: hashPassword(comment.password),
  };

  const result = await CommentRepository.createComment(input);

  const parsed = commentSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid comment response from DB");
  }

  return parsed.data;
};

const getCommentById = async (id: string): Promise<Comment> => {
  const comment = await CommentRepository.getCommentById(id);

  const parsed = commentSchema.safeParse(comment);

  if (!parsed.success) {
    throw new Error("Invalid comment response from DB");
  }

  return parsed.data;
};

const getCommentsBySongId = async (songId: string): Promise<Array<Comment>> => {
  await SongService.assertSongExists(songId);

  const comments = await CommentRepository.getCommentsBySongId(songId);

  const parsed = commentSchema.array().safeParse(comments);

  if (!parsed.success) {
    throw new Error("Invalid comment responses from DB");
  }

  return parsed.data;
};

const updateComment = async (id: string, comment: CommentUpdatePayload, pw: string) => {
  const existed = await getCommentById(id);

  if (!existed.password) {
    throw new Error("Comment password is not set");
  }

  const isValid = verifyPassword(pw, existed.password);

  if (!isValid) {
    throw new Error("Invalid password");
  }

  const parsedInput = updateCommentSchema.safeParse(comment);

  if (!parsedInput.success) {
    throw new Error("Invalid comment input");
  }

  const newCommentData: Comment = { ...existed, ...parsedInput.data };

  const updatedComment = await CommentRepository.updateComment(id, newCommentData);

  const parsed = commentSchema.safeParse(updatedComment);

  if (!parsed.success) {
    throw new Error("Invalid comment response from DB");
  }

  return parsed.data;
};

const deleteComment = async (id: string, pw: string): Promise<void> => {
  const comment = await CommentRepository.getCommentById(id);

  if (!comment) {
    throw new Error(`Comment with ID ${id} does not exist.`);
  }

  if (!comment.password) {
    throw new Error("Comment password is not set");
  }

  const isValid = verifyPassword(pw, comment.password);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  await CommentRepository.deleteComment(id);
};

const CommentService = {
  assertCommentExists,
  createComment,
  getCommentById,
  getCommentsBySongId,
  updateComment,
  deleteComment,
};

export default CommentService;
