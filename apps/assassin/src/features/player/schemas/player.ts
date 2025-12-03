import * as z from "zod";

const instrumentEnum = z.enum(["VOCAL", "GUITAR", "DRUM", "BASS", "KEYBOARD"]);

// DB에 저장할 때 입력 스키마
export const createPlayerSchema = z.object({
  songId: z.uuid(),
  name: z.string().min(1, "Name required"),
  instrument: instrumentEnum,
});

// 부분 업데이트
export const updatePlayerSchema = createPlayerSchema.partial();

// DB에서 받은 응답 스키마
export const playerSchema = createPlayerSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type Player = z.infer<typeof playerSchema>;