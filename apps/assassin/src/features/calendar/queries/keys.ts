export const calendarEventKeys = {
  all: ["calendarEvents"] as const,
  lists: (year?: number, month?: number) => [...calendarEventKeys.all, "list", { year, month }] as const,
};
