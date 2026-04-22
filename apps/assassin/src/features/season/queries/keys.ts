export const seasonKeys = {
  all: ["seasons"] as const,
  lists: (orgId: string) => [...seasonKeys.all, "list", { orgId }] as const,
  detail: (orgId: string, id: string) => [...seasonKeys.all, "detail", { orgId, id }] as const,
};
