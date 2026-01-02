import { dbSchemaWithoutDeletedAt } from "@libs/prisma/types";
import { bigIntToNumber } from "@libs/utils/zod";
import * as z from "zod";

// 입력값 스키마
export const createSeasonSchema = z.object({
  name: z.string().min(1, "Name required"),
  sortOrder: bigIntToNumber,
  isArchived: z.boolean().default(false),
});

export const updateSeasonSchema = createSeasonSchema
  .partial()
  .extend(dbSchemaWithoutDeletedAt.shape);

// 출력값 스키마 (DB 응답)
export const seasonSchema = createSeasonSchema.extend(dbSchemaWithoutDeletedAt.shape);

// 타입
export type SeasonPayload = z.infer<typeof createSeasonSchema>;
export type SeasonUpdatePayload = z.infer<typeof updateSeasonSchema>;
export type Season = z.infer<typeof seasonSchema>;
