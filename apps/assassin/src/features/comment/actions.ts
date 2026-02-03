"use server";

import { revalidatePath } from "next/cache";
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
  const result = await CommentService.createComment({ ...data, userId: user.id });
  revalidatePath(`/songs/${data.songId}`);
  return result;
};

export const updateCommentAction = async (id: string, data: CommentUpdatePayload) => {
  const user = await getCurrentUser();
  const result = await CommentService.updateComment(id, data, user.id);
  revalidatePath(`/songs/${data.songId}`);
  return result;
};

export const deleteCommentAction = async (id: string, songId: string) => {
  const user = await getCurrentUser();
  const result = await CommentService.deleteComment(id, user.id);
  revalidatePath(`/songs/${songId}`);
  return result;
};
