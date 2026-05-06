export const rsvpKeys = {
  all: ["rsvp"] as const,
  byEvent: (orgId: string, eventId: string) =>
    [...rsvpKeys.all, "byEvent", { orgId, eventId }] as const,
  byUser: (orgId: string, eventId: string) =>
    [...rsvpKeys.all, "byUser", { orgId, eventId }] as const,
};
