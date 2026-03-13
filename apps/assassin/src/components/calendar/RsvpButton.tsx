"use client";

import { Check, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRsvpLogic } from "@/features/rsvp/hooks/useRsvpLogic";
import { useRsvpHandlers } from "@/features/rsvp/hooks/useRsvpHandlers";

export function RsvpButton({ eventId }: { eventId: string }) {
  const { isAttending } = useRsvpLogic(eventId);
  const { handleToggle, isLoading } = useRsvpHandlers(eventId);

  return (
    <Button
      type="button"
      size="sm"
      variant={isAttending ? "default" : "outline"}
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isAttending ? "참석 취소" : "참석 신청"}
      aria-pressed={isAttending}
      className={
        isAttending
          ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
          : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
      }
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isAttending ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Plus className="h-3.5 w-3.5" />
      )}
      <span className="ml-1 text-xs">{isAttending ? "참석 중" : "참석"}</span>
    </Button>
  );
}
