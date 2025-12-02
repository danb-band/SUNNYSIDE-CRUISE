import * as z from "zod";

// 입력값 스키마
export const createSeasonSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string(),
  order: z.number().int(),
  isArchived: z.boolean().default(false),
})

export const updateSeasonSchema = createSeasonSchema.partial()

// 출력값 스키마 (DB 응답)
export const seasonSchema = createSeasonSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// 타입
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>
export type Season = z.infer<typeof seasonSchema>