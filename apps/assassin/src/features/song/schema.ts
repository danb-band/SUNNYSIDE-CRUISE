import { dbSchema } from "@libs/prisma/types";
import { bigIntToNumber } from "@libs/utils/zod";
import * as z from "zod";

// DB에 저장할 때 입력 스키마
export const createSongSchema = z.object({
  seasonId: z.uuid(),
  name: z.string().min(1, "Name required"),
  artist: z.string().min(1, "Artist required"),
  description: z.string(),
  youtubeUrl: z.url(),
  sortOrder: bigIntToNumber,
  userId: z.string().min(1, "User ID required"),
});

// 부분 업데이트 (userId 제외)
export const updateSongSchema = createSongSchema.partial().omit({ userId: true });

// DB에서 받은 응답 스키마
export const songSchema = createSongSchema.extend({
  ...dbSchema.shape,
  likeCount: z.number().int().min(0).default(0),
});

export type SongPayload = z.infer<typeof createSongSchema>;
export type SongUpdatePayload = z.infer<typeof updateSongSchema>;
export type Song = z.infer<typeof songSchema>;
