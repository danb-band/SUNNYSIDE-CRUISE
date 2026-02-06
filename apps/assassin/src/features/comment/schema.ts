import { dbSchema } from "@libs/prisma/types";
import * as z from "zod";

// DB에 저장할 때 입력 스키마
export const createCommentSchema = z.object({
  songId: z.uuid(),
  content: z.string().min(1, "Content required"),
  userId: z.string().min(1, "User ID required"),
});

// 부분 업데이트 (userId 제외)
export const updateCommentSchema = createCommentSchema.partial().omit({ userId: true });

export const profileSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

// DB에서 받은 응답 스키마
export const commentSchema = createCommentSchema.extend({
  ...dbSchema.shape,
  profile: profileSchema,
});

export type CommentPayload = z.infer<typeof createCommentSchema>;
export type CommentUpdatePayload = z.infer<typeof updateCommentSchema>;
export type Comment = z.infer<typeof commentSchema>;
