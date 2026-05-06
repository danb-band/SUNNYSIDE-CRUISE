"use server";

import { revalidateSeasonBoard } from "@libs/cache/seasonBoard";
import { getCurrentUser } from "@libs/supabase/auth";
import OrgRepository from "@features/org/repository";
import CommentService from "./service";
import { CommentUpdatePayload } from "./schema";
import CommentRepository from "./repository";

const getOrgIdBySongId = async (songId: string): Promise<string> => {
  const orgId = await OrgRepository.getOrgIdBySongId(songId);
  if (!orgId) {
    throw new Error(`Song with ID ${songId} does not exist.`);
  }
  return orgId;
};

export const getCommentAction = async (id: string) => {
  const user = await getCurrentUser();
  return await CommentService.getCommentById(id, user.id);
};

export const getCommentsBySongAction = async (songId: string) => {
  const user = await getCurrentUser();
  return await CommentService.getCommentsBySongId(songId, user.id);
};

export const getCommentsBySongPaginatedAction = async (
  songId: string,
  limit: number,
  cursor?: string,
) => {
  const user = await getCurrentUser();
  return await CommentService.getCommentsBySongIdPaginated(songId, limit, user.id, cursor);
};

export const createCommentAction = async (data: { songId: string; content: string }) => {
  const user = await getCurrentUser();
  const result = await CommentService.createComment({ ...data, userId: user.id }, user.id);
  const orgId = await getOrgIdBySongId(result.songId);
  revalidateSeasonBoard(orgId);
  return result;
};

export const updateCommentAction = async (id: string, data: CommentUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await CommentService.updateComment(id, data, user.id);
  const orgId = await getOrgIdBySongId(result.songId);
  revalidateSeasonBoard(orgId);
  return result;
};

export const deleteCommentAction = async (id: string) => {
  const user = await getCurrentUser();
  const existing = await CommentRepository.getCommentById(id);
  if (!existing) {
    throw new Error(`Comment with ID ${id} does not exist.`);
  }
  const orgId = await getOrgIdBySongId(existing.songId);
  const result = await CommentService.deleteComment(id, user.id);
  revalidateSeasonBoard(orgId);
  return result;
};
