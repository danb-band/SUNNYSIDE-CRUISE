export const commentKeys = {
  all: ["comments"] as const,
  lists: (orgId: string) => [...commentKeys.all, "list", { orgId }] as const,
  bySong: (orgId: string, songId: string) =>
    [...commentKeys.all, "bySong", { orgId, songId }] as const,
};
