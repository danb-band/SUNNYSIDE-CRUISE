export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  profilesBySong: (orgId: string, songId: string) =>
    [...userKeys.all, "profilesBySong", { orgId, songId }] as const,
};
