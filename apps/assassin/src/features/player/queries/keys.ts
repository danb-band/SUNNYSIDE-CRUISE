export const playerKeys = {
  all: ["players"] as const,
  lists: (orgId: string) => [...playerKeys.all, "list", { orgId }] as const,
  bySong: (orgId: string, songId: string) =>
    [...playerKeys.all, "bySong", { orgId, songId }] as const,
  detail: (orgId: string, id: string) => [...playerKeys.all, "detail", { orgId, id }] as const,
};
