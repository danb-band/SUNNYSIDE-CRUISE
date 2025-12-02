import * as z from "zod";

// DB에 저장할 때 입력 스키마
export const createCommentSchema = z.object({
  songId: z.uuid(),
  content: z.string().min(1, "Content required"),
  writer: z.string().min(1, "Writer required"),
  deletePw: z.string().min(1, "Password required"),
});

// 부분 업데이트
export const updateCommentSchema = createCommentSchema.partial();

// DB에서 받은 응답 스키마
export const commentSchema = createCommentSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type Comment = z.infer<typeof commentSchema>;
