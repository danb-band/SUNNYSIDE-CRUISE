export const playerKeys = {
  all: ["players"] as const,
  lists: () => [...playerKeys.all, "list"] as const,
  bySong: (songId: string) => [...playerKeys.all, "bySong", songId] as const,
  detail: (id: string) => [...playerKeys.all, "detail", id] as const,
};
