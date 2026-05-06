export const eventSongKeys = {
  all: ["eventSong"] as const,
  org: (orgId: string) => [...eventSongKeys.all, { orgId }] as const,
  byEvent: (orgId: string, eventId: string) =>
    [...eventSongKeys.org(orgId), "byEvent", { eventId }] as const,
};
