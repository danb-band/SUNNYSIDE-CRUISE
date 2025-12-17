export const seasonKeys = {
  all: ["seasons"] as const,
  lists: () => [...seasonKeys.all, "list"] as const,
  detail: (id: string) => [...seasonKeys.all, "detail", id] as const,
};
