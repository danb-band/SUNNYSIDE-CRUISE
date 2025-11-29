import * as z from "zod";

export const songSchema = z.object({
  seasonId: z.uuid(),
  name: z.string(),
  artist: z.string(),
  description: z.string(),
  youtubeUrl: z.url(),
  order: z.number().int(),
  writer: z.string(),
  deletePw: z.string(),
});

export const songResponseSchema = songSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Song = z.infer<typeof songSchema>;
export type SongResponse = z.infer<typeof songResponseSchema>;
