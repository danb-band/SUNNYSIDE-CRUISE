import * as z from "zod";

export const createEventSongSchema = z.object({
  eventId: z.uuid(),
  songId: z.uuid(),
});

export const eventSongSchema = z.object({
  id: z.uuid(),
  eventId: z.uuid(),
  songId: z.uuid(),
  createdAt: z.date(),
  song: z.object({
    id: z.uuid(),
    name: z.string(),
    artist: z.string(),
  }),
});

export type CreateEventSongPayload = z.infer<typeof createEventSongSchema>;
export type EventSong = z.infer<typeof eventSongSchema>;
