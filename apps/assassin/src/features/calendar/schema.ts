import { dbSchemaWithoutDeletedAt } from "@libs/prisma/types";
import * as z from "zod";

export const createCalendarEventSchema = z.object({
  title: z.string().min(1, "Title required"),
  location: z.string().min(1, "Location required"),
  startDate: z.date(),
  endDate: z.date(),
});

export const updateCalendarEventSchema = createCalendarEventSchema.partial();

export const calendarEventSchema = createCalendarEventSchema.extend(dbSchemaWithoutDeletedAt.shape);

export type CalendarEventPayload = z.infer<typeof createCalendarEventSchema>;
export type CalendarEventUpdatePayload = z.infer<typeof updateCalendarEventSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
