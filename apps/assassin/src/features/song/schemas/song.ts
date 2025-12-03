import * as z from "zod";

// DB에 저장할 때 입력 스키마
export const createSongSchema = z.object({
  seasonId: z.uuid(),
  name: z.string().min(1, "Name required"),
  artist: z.string().min(1, "Artist required"),
  description: z.string(),
  youtubeUrl: z.url(),
  order: z.number().int(),
  writer: z.string().min(1, "Writer required"),
  deletePw: z.string().min(1, "Password required"),
});

// 부분 업데이트
export const updateSongSchema = createSongSchema.partial();

// DB에서 받은 응답 스키마
export const songSchema = createSongSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type CreateSongInput = z.infer<typeof createSongSchema>;
export type UpdateSongInput = z.infer<typeof updateSongSchema>;
export type Song = z.infer<typeof songSchema>;
