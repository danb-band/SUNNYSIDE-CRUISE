"use client";

import { useRef, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { useRsvpLogic } from "@/features/rsvp/hooks/useRsvpLogic";

export function RsvpList({ eventId }: { eventId: string }) {
  const { attendees, attendeeCount } = useRsvpLogic(eventId);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setOpen((prev) => !prev);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setOpen(false);
    }
  };

  return (
    <div className="mt-2 relative" ref={containerRef} onBlur={handleBlur}>
      <div className="flex items-center gap-1.5">
        <Users className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          참석자 :{" "}
        </span>
        {attendeeCount > 0 ? (
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            {attendeeCount}명
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            없음
          </span>
        )}
      </div>

      {open && attendeeCount > 0 && (
        <div
          role="listbox"
          aria-label="참석자 목록"
          className="absolute left-0 z-10 mt-1 min-w-[140px] max-w-[240px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1 text-sm"
        >
          <div className="max-h-48 overflow-y-auto">
            {attendees.map((rsvp) => (
              <div
                key={rsvp.userId}
                role="option"
                aria-selected={false}
                className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-default"
              >
                {rsvp.profile.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
