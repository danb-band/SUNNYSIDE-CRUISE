import * as z from "zod";

const instrumentEnum = z.enum(["VOCAL", "GUITAR", "DRUM", "BASS", "KEYBOARD"]);

export const playerSchema = z.object({
  songId: z.uuid(),
  name: z.string(),
  instrument: instrumentEnum,
});

export const playerResponseSchema = playerSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date(),
});

export type Player = z.infer<typeof playerSchema>;
export type PlayerResponse = z.infer<typeof playerResponseSchema>;
