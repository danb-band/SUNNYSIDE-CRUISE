export const calendarEventKeys = {
  all: ["calendarEvents"] as const,
  lists: (orgId: string, year?: number, month?: number) =>
    [...calendarEventKeys.all, "list", { orgId, year, month }] as const,
};
