"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@libs/supabase/auth";
import CommentService from "./service";
import { CommentUpdatePayload } from "./schema";

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
  revalidatePath(`/song/${data.songId}`);
  return result;
};

export const updateCommentAction = async (id: string, data: CommentUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await CommentService.updateComment(id, data, user.id);
  revalidatePath(`/song/${data.songId}`);
  return result;
};

export const deleteCommentAction = async (id: string, songId: string) => {
  const user = await getCurrentUser();
  const result = await CommentService.deleteComment(id, user.id);
  revalidatePath(`/song/${songId}`);
  return result;
};
