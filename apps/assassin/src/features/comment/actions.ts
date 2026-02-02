"use server";

import { getCurrentUser } from "@libs/supabase/auth";
import CommentService from "./service";
import { CommentUpdatePayload } from "./schema";

export const getCommentAction = async (id: string) => {
  return await CommentService.getCommentById(id);
};

export const getCommentsBySongAction = async (songId: string) => {
  return await CommentService.getCommentsBySongId(songId);
};

export const createCommentAction = async (data: { songId: string; content: string }) => {
  const user = await getCurrentUser();
  return await CommentService.createComment({ ...data, userId: user.id });
};

export const updateCommentAction = async (id: string, data: CommentUpdatePayload) => {
  const user = await getCurrentUser();
  return await CommentService.updateComment(id, data, user.id);
};

export const deleteCommentAction = async (id: string) => {
  const user = await getCurrentUser();
  return await CommentService.deleteComment(id, user.id);
};
