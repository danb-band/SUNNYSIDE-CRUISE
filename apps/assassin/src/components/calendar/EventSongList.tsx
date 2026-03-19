"use client";

import { Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSongsByEvent } from "@/features/eventSong/queries/useSongsByEvent";
import { useRemoveEventSong } from "@/features/eventSong/mutations/useRemoveEventSong";

export function EventSongList({ eventId }: { eventId: string }) {
  const { data: eventSongs = [] } = useSongsByEvent(eventId);
  const { mutate: remove, isPending } = useRemoveEventSong(eventId);

  return (
    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Music className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">연주 곡</span>
        {eventSongs.length > 0 && (
          <span className="text-xs text-slate-400">({eventSongs.length})</span>
        )}
      </div>
      {eventSongs.length === 0 ? (
        <span className="text-xs text-slate-400 dark:text-slate-500">없음</span>
      ) : (
        <ul className="space-y-1">
          {eventSongs.map((es) => (
            <li key={es.id} className="flex items-center justify-between gap-2 group">
              <span className="text-xs text-slate-700 dark:text-slate-200 truncate">
                {es.song.name}
                <span className="text-slate-400 ml-1">— {es.song.artist}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`곡 제거: ${es.song.name} — ${es.song.artist}`}
                disabled={isPending}
                onClick={() => remove(es.id)}
                className="h-5 w-5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
