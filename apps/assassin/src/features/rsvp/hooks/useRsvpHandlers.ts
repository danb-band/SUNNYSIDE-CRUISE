import { useCallback } from "react";
import { useToggleRsvp } from "../mutations/useToggleRsvp";

export const useRsvpHandlers = (eventId: string) => {
  const toggleRsvpMutation = useToggleRsvp(eventId);

  const handleToggle = useCallback(async () => {
    if (toggleRsvpMutation.isPending) return;
    await toggleRsvpMutation.mutateAsync();
  }, [toggleRsvpMutation]);

  return {
    handleToggle,
    isLoading: toggleRsvpMutation.isPending,
  };
};
