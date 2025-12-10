import { PrismaClient } from "@generated/prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/client";

export type TransactionClient = Omit<
  PrismaClient<never, undefined, DefaultArgs>,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;
