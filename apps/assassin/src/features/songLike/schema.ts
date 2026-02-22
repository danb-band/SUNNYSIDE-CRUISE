import * as z from "zod";

export const songLikeSchema = z.object({
  id: z.uuid(),
  songId: z.uuid(),
  userId: z.uuid(),
  createdAt: z.date(),
});

export type SongLike = z.infer<typeof songLikeSchema>;
