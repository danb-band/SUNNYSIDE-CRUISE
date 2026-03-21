export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  allProfiles: () => [...userKeys.all, "profiles"] as const,
};
