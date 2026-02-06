export const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  bySong: (songId: string) => [...commentKeys.all, "bySong", songId] as const,
};
