import { dbSchema } from "@libs/prisma/types";
import * as z from "zod";

// DB에 저장할 때 입력 스키마
export const createCommentSchema = z.object({
  songId: z.uuid(),
  content: z.string().min(1, "Content required"),
  writer: z.string().min(1, "Writer required"),
  password: z.string().min(1, "Password required"),
});

// 부분 업데이트
export const updateCommentSchema = createCommentSchema.partial().omit({ password: true });

// DB에서 받은 응답 스키마 (password는 내려주지 않음)
export const commentSchema = createCommentSchema.omit({ password: true }).extend(dbSchema.shape);

export type CommentPayload = z.infer<typeof createCommentSchema>;
export type CommentUpdatePayload = z.infer<typeof updateCommentSchema>;
export type Comment = z.infer<typeof commentSchema>;
