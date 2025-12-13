import { PrismaClient } from "@generated/prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/client";
import * as z from "zod";

export type TransactionClient = Omit<
  PrismaClient<never, undefined, DefaultArgs>,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export const dbSchema = z.object({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const dbSchemaWithoutDeletedAt = dbSchema.omit({ deletedAt: true });

export type DBType = z.infer<typeof dbSchema>;
export type DBTypeWithoutDeletedAt = z.infer<typeof dbSchemaWithoutDeletedAt>;
