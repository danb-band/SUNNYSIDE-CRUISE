"use client";

import { Song } from "@features/song/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Music } from "lucide-react";

interface SongItemProps {
  song: Song;
}

export function SongItem({ song }: SongItemProps) {
  return (
    <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 py-4">
      <CardContent className="px-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            <Music className="h-5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
              {song.name}
            </h4>
            <p className="truncate text-xs text-slate-600 dark:text-slate-400">{song.artist}</p>
            {song.description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                {song.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
