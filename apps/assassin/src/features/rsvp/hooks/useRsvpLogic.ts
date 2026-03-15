import { useRsvpByEvent } from "../queries/useRsvpByEvent";
import { useUserRsvpStatus } from "../queries/useUserRsvpStatus";

export const useRsvpLogic = (eventId: string) => {
  const { data: attendees = [] } = useRsvpByEvent(eventId);
  const { data: userStatus } = useUserRsvpStatus(eventId);

  const isAttending = userStatus === "ATTENDING";
  const attendeeCount = attendees.length;

  return {
    attendees,
    isAttending,
    attendeeCount,
  };
};
