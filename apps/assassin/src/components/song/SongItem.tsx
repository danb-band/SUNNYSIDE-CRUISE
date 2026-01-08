"use client";

import { Song } from "@features/song/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Music } from "lucide-react";

interface SongItemProps {
  song: Song;
}

export function SongItem({ song }: SongItemProps) {
  return (
    <Card className="transition-colors hover:bg-accent">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-semibold">{song.name}</h4>
            <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
            {song.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {song.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
