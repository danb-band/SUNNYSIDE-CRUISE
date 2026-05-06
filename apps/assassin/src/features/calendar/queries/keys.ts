export const calendarEventKeys = {
  all: ["calendarEvents"] as const,
  lists: (orgId: string, year?: number, month?: number) => {
    const scope = year !== undefined && month !== undefined ? { orgId, year, month } : { orgId };
    return [...calendarEventKeys.all, "list", scope] as const;
  },
};
