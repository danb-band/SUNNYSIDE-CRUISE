export const songLikeKeys = {
  all: ["songLikes"] as const,
  byUser: (songId: string) => [...songLikeKeys.all, "byUser", songId] as const,
};
