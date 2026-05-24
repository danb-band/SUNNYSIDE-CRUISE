export const songLikeKeys = {
  all: ["songLikes"] as const,
  byUser: (orgId: string, songId: string) =>
    [...songLikeKeys.all, "byUser", { orgId, songId }] as const,
};
