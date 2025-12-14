export const songKeys = {
  all: ["songs"] as const,
  lists: () => [...songKeys.all, "list"] as const,
  bySeason: (seasonId: string) => [...songKeys.all, "bySeason", seasonId] as const,
  detail: (id: string) => [...songKeys.all, "detail", id] as const,
};
