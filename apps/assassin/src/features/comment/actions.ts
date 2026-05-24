"use server";

import { revalidateSongDetail } from "@libs/cache/songDetail";
import { getCurrentUser } from "@libs/supabase/auth";
import CommentService from "./service";
import { CommentUpdatePayload } from "./schema";

export const getCommentAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  return await CommentService.getCommentById(id, user.id, orgId);
};

export const getCommentsBySongAction = async (songId: string, orgId: string) => {
  const user = await getCurrentUser();
  return await CommentService.getCommentsBySongId(songId, user.id, orgId);
};

export const getCommentsBySongPaginatedAction = async (
  songId: string,
  orgId: string,
  limit: number,
  cursor?: string,
) => {
  const user = await getCurrentUser();
  return await CommentService.getCommentsBySongIdPaginated(songId, limit, user.id, orgId, cursor);
};

export const createCommentAction = async (
  orgId: string,
  data: { songId: string; content: string },
) => {
  const user = await getCurrentUser();
  const result = await CommentService.createComment({ ...data, userId: user.id }, user.id, orgId);
  revalidateSongDetail(result.songId);
  return result;
};

export const updateCommentAction = async (
  id: string,
  orgId: string,
  data: CommentUpdatePayload,
) => {
  const user = await getCurrentUser();
  const result = await CommentService.updateComment(id, data, user.id, orgId);
  revalidateSongDetail(result.songId);
  return result;
};

export const softDeleteCommentAction = async (id: string, orgId: string) => {
  const user = await getCurrentUser();
  const existing = await CommentService.getCommentById(id, user.id, orgId);
  await CommentService.softDeleteComment(id, user.id, orgId);
  revalidateSongDetail(existing.songId);
};
