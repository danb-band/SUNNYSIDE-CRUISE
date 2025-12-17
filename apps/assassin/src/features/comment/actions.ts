"use server";

import CommentService from "./service";
import { CommentPayload, CommentUpdatePayload } from "./schema";

export const getCommentAction = async (id: string) => {
  return await CommentService.getCommentById(id);
};

export const getCommentsBySongAction = async (songId: string) => {
  return await CommentService.getCommentsBySongId(songId);
};

export const createCommentAction = async (data: CommentPayload) => {
  return await CommentService.createComment(data);
};

export const updateCommentAction = async (id: string, data: CommentUpdatePayload) => {
  return await CommentService.updateComment(id, data);
};

export const deleteCommentAction = async (id: string) => {
  return await CommentService.deleteComment(id);
};
