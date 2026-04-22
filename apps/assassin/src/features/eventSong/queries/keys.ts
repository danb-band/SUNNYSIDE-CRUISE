export const eventSongKeys = {
  all: ["eventSong"] as const,
  byEvent: (orgId: string, eventId: string) =>
    [...eventSongKeys.all, "byEvent", { orgId, eventId }] as const,
};
