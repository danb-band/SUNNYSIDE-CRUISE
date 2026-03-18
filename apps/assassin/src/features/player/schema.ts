import { dbSchema } from "@libs/prisma/types";
import * as z from "zod";
import { profileSchema } from "@features/user/schema";

const instrumentEnum = z.enum(["VOCAL", "GUITAR", "DRUM", "BASS", "KEYBOARD"]);

// DB에 저장할 때 입력 스키마
export const createPlayerSchema = z.object({
  songId: z.uuid(),
  userId: z.string().uuid("userId is required"),
  instrument: instrumentEnum,
});

// 부분 업데이트
export const updatePlayerSchema = createPlayerSchema.partial();

// DB에서 받은 응답 스키마
export const playerSchema = createPlayerSchema.extend(dbSchema.shape);

// profile을 포함한 응답 스키마
export const playerWithProfileSchema = playerSchema.extend({
  profile: profileSchema,
});

export type PlayerPayload = z.infer<typeof createPlayerSchema>;
export type PlayerUpdatePayload = z.infer<typeof updatePlayerSchema>;
export type Player = z.infer<typeof playerSchema>;
export type PlayerWithProfile = z.infer<typeof playerWithProfileSchema>;
export type Instrument = z.infer<typeof instrumentEnum>;
