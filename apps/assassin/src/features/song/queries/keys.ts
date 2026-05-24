export const songKeys = {
  byOrg: (orgId: string) => ["songs", "list", { orgId }] as const,
  bySeason: (orgId: string, seasonId: string) =>
    ["songs", "bySeason", { orgId, seasonId }] as const,
  detail: (orgId: string, id: string) => ["songs", "detail", { orgId, id }] as const,
};
