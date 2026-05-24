import { assertOrgMember } from "@features/org/service";
import SongRepository from "@features/song/repository";
import CommentRepository from "./repository";
import {
  Comment,
  commentSchema,
  CommentPayload,
  CommentUpdatePayload,
  updateCommentSchema,
} from "./schema";

const assertCommentExists = async (commentId: string, orgId: string): Promise<void> => {
  const comment = await CommentRepository.getCommentById(commentId, orgId);
  const parsed = commentSchema.safeParse(comment);
  if (!parsed.success) {
    throw new Error(`Comment with ID ${commentId} does not exist.`);
  }
};

const createComment = async (
  comment: CommentPayload,
  userId: string,
  orgId: string,
): Promise<Comment> => {
  if (comment.userId !== userId) {
    throw new Error("Unauthorized: invalid comment author");
  }
  await assertOrgMember(userId, orgId);
  const result = await CommentRepository.createComment(comment, orgId);
  const parsed = commentSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error("Invalid comment response from DB");
  }
  return parsed.data;
};

const getCommentById = async (id: string, userId: string, orgId: string): Promise<Comment> => {
  await assertOrgMember(userId, orgId);
  const comment = await CommentRepository.getCommentById(id, orgId);
  const parsed = commentSchema.safeParse(comment);
  if (!parsed.success) {
    throw new Error("Invalid comment response from DB");
  }
  return parsed.data;
};

const getCommentsBySongId = async (
  songId: string,
  userId: string,
  orgId: string,
): Promise<Array<Comment>> => {
  await assertOrgMember(userId, orgId);
  const comments = await CommentRepository.getCommentsBySongId(songId, orgId);
  const parsed = commentSchema.array().safeParse(comments);
  if (!parsed.success) {
    throw new Error("Invalid comment responses from DB");
  }
  return parsed.data;
};

const getCommentsBySongIdPaginated = async (
  songId: string,
  limit: number,
  userId: string,
  orgId: string,
  cursor?: string,
): Promise<{ comments: Comment[]; nextCursor: string | null }> => {
  await assertOrgMember(userId, orgId);
  const result = await CommentRepository.getCommentsBySongIdPaginated(songId, orgId, limit, cursor);
  const parsed = commentSchema.array().safeParse(result);
  if (!parsed.success) {
    throw new Error("Invalid paginated comments response from DB");
  }
  const hasMore = parsed.data.length > limit;
  const comments = hasMore ? parsed.data.slice(0, limit) : parsed.data;
  const nextCursor = hasMore ? comments[comments.length - 1].id : null;
  return { comments, nextCursor };
};

const updateComment = async (
  id: string,
  comment: CommentUpdatePayload,
  userId: string,
  orgId: string,
) => {
  await assertOrgMember(userId, orgId);

  const existed = await CommentRepository.getCommentById(id, orgId);
  const parsedExisted = commentSchema.safeParse(existed);
  if (!parsedExisted.success) throw new Error("Comment not found");

  if (parsedExisted.data.userId !== userId) {
    throw new Error("Unauthorized: you can only edit your own comments");
  }

  const parsedInput = updateCommentSchema.safeParse(comment);
  if (!parsedInput.success) throw new Error("Invalid comment input");

  if (parsedInput.data.songId && parsedInput.data.songId !== parsedExisted.data.songId) {
    const targetSong = await SongRepository.getSongByIdInOrg(parsedInput.data.songId, orgId);
    if (!targetSong) throw new Error("Cross-org comment move is not allowed");
  }

  const newCommentData: Comment = { ...parsedExisted.data, ...parsedInput.data };
  const updatedComment = await CommentRepository.updateComment(id, orgId, newCommentData);
  const parsed = commentSchema.safeParse(updatedComment);
  if (!parsed.success) throw new Error("Invalid comment response from DB");
  return parsed.data;
};

const softDeleteComment = async (id: string, userId: string, orgId: string): Promise<void> => {
  await assertOrgMember(userId, orgId);

  const comment = await CommentRepository.getCommentById(id, orgId);
  const parsed = commentSchema.safeParse(comment);
  if (!parsed.success) throw new Error("Comment not found");

  if (parsed.data.userId !== userId) {
    throw new Error("Unauthorized: you can only delete your own comments");
  }

  await CommentRepository.softDeleteComment(id, orgId);
};

const CommentService = {
  assertCommentExists,
  createComment,
  getCommentById,
  getCommentsBySongId,
  getCommentsBySongIdPaginated,
  updateComment,
  softDeleteComment,
};

export default CommentService;
