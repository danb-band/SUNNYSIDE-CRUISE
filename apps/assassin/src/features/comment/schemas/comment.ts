import * as z from "zod";

export const commentSchema = z.object({
  songId: z.uuid(),
  content: z.string(),
  writer: z.string(),
  deletePw: z.string(),
});

export const commentResponseSchema = commentSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date(),
});

export type Comment = z.infer<typeof commentSchema>;
export type CommentResponse = z.infer<typeof commentResponseSchema>;
