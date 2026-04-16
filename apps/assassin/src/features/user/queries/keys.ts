export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  profilesBySong: (songId: string) => [...userKeys.all, "profilesBySong", songId] as const,
};
