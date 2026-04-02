export const orgKeys = {
  all: ["org"] as const,
  bySlug: (slug: string) => [...orgKeys.all, "slug", slug] as const,
};
