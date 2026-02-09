"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Song } from "@features/song/schema";
import { cn } from "@/libs/shadcn/utils";
import { SongItem } from "./SongItem";

interface SortableSongItemProps {
  song: Song;
}

export function SortableSongItem({ song }: SortableSongItemProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const router = useRouter();
  const sortable = useSortable({
    id: song.id,
    disabled: !isMounted,
  });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style: CSSProperties = isMounted
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : {};

  const handleClick = useCallback(() => {
    if (isDragging) return;
    router.push(`/song/${song.id}`);
  }, [isDragging, router, song.id]);

  if (!isMounted) {
    return <SongItem song={song} onClick={handleClick} className="cursor-grab" />;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("touch-none", isDragging && "opacity-60")}
      {...attributes}
      {...listeners}
    >
      <SongItem
        song={song}
        onClick={handleClick}
        className={cn(
          "cursor-grab active:cursor-grabbing",
          isDragging && "ring-2 ring-blue-400/60",
        )}
      />
    </div>
  );
}
