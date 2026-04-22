export const songKeys = {
  all: ["songs"] as const,
  lists: (orgId: string) => [...songKeys.all, "list", { orgId }] as const,
  bySeason: (orgId: string, seasonId: string) =>
    [...songKeys.all, "bySeason", { orgId, seasonId }] as const,
  detail: (orgId: string, id: string) => [...songKeys.all, "detail", { orgId, id }] as const,
};
