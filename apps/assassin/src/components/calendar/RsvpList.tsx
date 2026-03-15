"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Users } from "lucide-react";
import { useRsvpLogic } from "@/features/rsvp/hooks/useRsvpLogic";

export function RsvpList({ eventId }: { eventId: string }) {
  const { attendees, attendeeCount } = useRsvpLogic(eventId);
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 140 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => setOpen((prev) => !prev);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setDropdownPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 140),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!containerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="mt-2 relative" ref={containerRef}>
      <div className="flex items-center gap-1.5">
        <Users className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">참석자 : </span>
        {attendeeCount > 0 ? (
          <button
            ref={triggerRef}
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
          <span className="text-xs text-slate-400 dark:text-slate-500">없음</span>
        )}
      </div>

      {typeof document !== "undefined" &&
        open &&
        attendeeCount > 0 &&
        createPortal(
          <div
            role="listbox"
            aria-label="참석자 목록"
            className="fixed z-50 max-w-[240px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1 text-sm"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              minWidth: dropdownPosition.width,
            }}
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
          </div>,
          document.body,
        )}
    </div>
  );
}
