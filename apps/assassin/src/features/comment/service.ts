import SongService from "@features/song/service";
import OrgRepository from "@features/org/repository";
import CommentRepository from "./repository";
import {
  Comment,
  commentSchema,
  CommentPayload,
  CommentUpdatePayload,
  updateCommentSchema,
} from "./schema";

const assertCommentExists = async (commentId: string): Promise<void> => {
  const comment = await CommentRepository.getCommentById(commentId);

  const parsed = commentSchema.safeParse(comment);

  if (!parsed.success) {
    throw new Error(`Comment with ID ${commentId} does not exist.`);
  }
};

const createComment = async (comment: CommentPayload, userId: string): Promise<Comment> => {
  if (comment.userId !== userId) {
    throw new Error("Unauthorized: invalid comment author");
  }

  await SongService.assertSongAccess(comment.songId, userId);

  const result = await CommentRepository.createComment(comment);

  const parsed = commentSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid comment response from DB");
  }

  return parsed.data;
};

const getCommentById = async (id: string, userId: string): Promise<Comment> => {
  const comment = await CommentRepository.getCommentById(id);

  const parsed = commentSchema.safeParse(comment);

  if (!parsed.success) {
    throw new Error("Invalid comment response from DB");
  }

  await SongService.assertSongAccess(parsed.data.songId, userId);

  return parsed.data;
};

const getCommentsBySongId = async (songId: string, userId: string): Promise<Array<Comment>> => {
  await SongService.assertSongAccess(songId, userId);

  const comments = await CommentRepository.getCommentsBySongId(songId);

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
  cursor?: string,
): Promise<{ comments: Comment[]; nextCursor: string | null }> => {
  await SongService.assertSongAccess(songId, userId);

  const result = await CommentRepository.getCommentsBySongIdPaginated(songId, limit, cursor);

  const parsed = commentSchema.array().safeParse(result);

  if (!parsed.success) {
    throw new Error("Invalid paginated comments response from DB");
  }

  const hasMore = parsed.data.length > limit;
  // 초과 1개를 잘라내고 실제 limit 개수만 반환
  const comments = hasMore ? parsed.data.slice(0, limit) : parsed.data;
  const nextCursor = hasMore ? comments[comments.length - 1].id : null;

  return { comments, nextCursor };
};

const updateComment = async (id: string, comment: CommentUpdatePayload, userId: string) => {
  const existed = await getCommentById(id, userId);

  if (existed.userId !== userId) {
    throw new Error("Unauthorized: you can only edit your own comments");
  }

  const parsedInput = updateCommentSchema.safeParse(comment);

  if (!parsedInput.success) {
    throw new Error("Invalid comment input");
  }

  const sourceOrgId = await OrgRepository.getOrgIdBySongId(existed.songId);
  if (!sourceOrgId) {
    throw new Error(`Song with ID ${existed.songId} does not exist.`);
  }

  const targetSongId = parsedInput.data.songId ?? existed.songId;
  const targetOrgId =
    targetSongId === existed.songId
      ? sourceOrgId
      : await SongService.assertSongAccess(targetSongId, userId);

  if (targetOrgId !== sourceOrgId) {
    throw new Error("Cross-org comment move is not allowed");
  }

  const newCommentData: Comment = { ...existed, ...parsedInput.data };

  const updatedComment = await CommentRepository.updateComment(id, newCommentData);

  const parsed = commentSchema.safeParse(updatedComment);

  if (!parsed.success) {
    throw new Error("Invalid comment response from DB");
  }

  return parsed.data;
};

const deleteComment = async (id: string, userId: string): Promise<void> => {
  const comment = await getCommentById(id, userId);

  if (comment.userId !== userId) {
    throw new Error("Unauthorized: you can only delete your own comments");
  }

  await CommentRepository.deleteComment(id);
};

const CommentService = {
  assertCommentExists,
  createComment,
  getCommentById,
  getCommentsBySongId,
  getCommentsBySongIdPaginated,
  updateComment,
  deleteComment,
};

export default CommentService;
