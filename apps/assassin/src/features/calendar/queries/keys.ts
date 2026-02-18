export const calendarEventKeys = {
  all: ["calendarEvents"] as const,
  lists: () => [...calendarEventKeys.all, "list"] as const,
};
