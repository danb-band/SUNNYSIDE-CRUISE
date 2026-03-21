export const eventSongKeys = {
  all: ["eventSong"] as const,
  byEvent: (eventId: string) => [...eventSongKeys.all, "byEvent", eventId] as const,
};
