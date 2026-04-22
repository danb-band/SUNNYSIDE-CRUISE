export const songKeys = {
  all: ["songs"] as const,
  org: (orgId: string) => [...songKeys.all, { orgId }] as const,
  lists: (orgId: string) => [...songKeys.org(orgId), "list"] as const,
  bySeason: (orgId: string, seasonId: string) =>
    [...songKeys.org(orgId), "bySeason", { seasonId }] as const,
  detail: (orgId: string, id: string) => [...songKeys.org(orgId), "detail", { id }] as const,
};
