"use server";

import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@libs/supabase/auth";
import CommentService from "./service";
import { CommentUpdatePayload } from "./schema";

export const getCommentAction = async (id: string) => {
  return await CommentService.getCommentById(id);
};

export const getCommentsBySongAction = async (songId: string) => {
  return await CommentService.getCommentsBySongId(songId);
};

export const getCommentsBySongPaginatedAction = async (
  songId: string,
  limit: number,
  cursor?: string,
) => {
  return await CommentService.getCommentsBySongIdPaginated(songId, limit, cursor);
};

export const createCommentAction = async (data: { songId: string; content: string }) => {
  const user = await getCurrentUser();
  const result = await CommentService.createComment({ ...data, userId: user.id });
  revalidateTag("comments", "max");
  revalidateTag(`comments:${data.songId}`, "max");
  return result;
};

export const updateCommentAction = async (id: string, data: CommentUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await CommentService.updateComment(id, data, user.id);
  revalidateTag("comments", "max");
  return result;
};

export const deleteCommentAction = async (id: string) => {
  const user = await getCurrentUser();
  const result = await CommentService.deleteComment(id, user.id);
  revalidateTag("comments", "max");
  return result;
};
