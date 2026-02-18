export const calendarEventKeys = {
  all: ["calendarEvents"] as const,
  lists: () => [...calendarEventKeys.all, "list"] as const,
  detail: (id: string) => [...calendarEventKeys.all, "detail", id] as const,
};
