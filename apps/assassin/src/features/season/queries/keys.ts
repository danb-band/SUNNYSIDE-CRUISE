export const seasonKeys = {
  all: ["seasons"] as const,
  org: (orgId: string) => [...seasonKeys.all, { orgId }] as const,
  lists: (orgId: string) => [...seasonKeys.org(orgId), "list"] as const,
  detail: (orgId: string, id: string) => [...seasonKeys.org(orgId), "detail", { id }] as const,
};
