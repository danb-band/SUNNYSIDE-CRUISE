export const seasonKeys = {
  all: ["seasons"] as const,
  lists: (orgId: string) => [...seasonKeys.all, "list", { orgId }] as const,
  detail: (id: string) => [...seasonKeys.all, "detail", id] as const,
};
