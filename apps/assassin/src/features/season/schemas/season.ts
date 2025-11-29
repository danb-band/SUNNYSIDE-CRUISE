import * as z from "zod";

export const seasonSchema = z.object({
  name: z.uuid(),
  description: z.string(),
  order: z.number().int(),
  isArchived: z.boolean().default(false),
});

export const seasonResponseSchema = seasonSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Season = z.infer<typeof seasonSchema>;
export type SeasonResponse = z.infer<typeof seasonResponseSchema>;
