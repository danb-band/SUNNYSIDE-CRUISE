"use client";

import { Users } from "lucide-react";
import { useRsvpLogic } from "@/features/rsvp/hooks/useRsvpLogic";

export function RsvpList({ eventId }: { eventId: string }) {
  const { attendees, attendeeCount } = useRsvpLogic(eventId);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Users className="h-3 w-3 text-slate-400" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          참석자 {attendeeCount > 0 ? `${attendeeCount}명` : "없음"}
        </span>
      </div>
      {attendeeCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {attendees.slice(0, 5).map((rsvp) => (
            <span
              key={rsvp.userId}
              className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full px-2 py-0.5"
            >
              {rsvp.profile.name}
            </span>
          ))}
          {attendeeCount > 5 && (
            <span className="text-xs text-slate-400 dark:text-slate-500 px-1 py-0.5">
              +{attendeeCount - 5}명 더
            </span>
          )}
        </div>
      )}
    </div>
  );
}
