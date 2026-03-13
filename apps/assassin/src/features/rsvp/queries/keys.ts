export const rsvpKeys = {
  all: ["rsvp"] as const,
  byEvent: (eventId: string) => [...rsvpKeys.all, "byEvent", eventId] as const,
  byUser: (eventId: string) => [...rsvpKeys.all, "byUser", eventId] as const,
};
