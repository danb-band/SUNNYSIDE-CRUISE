"use client";

import { useState } from "react";
import { Season } from "@features/season/schema";
import { useSongsBySeason } from "@features/song/queries/useSongsBySeason";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { SongItem } from "../song/SongItem";
import { AddSongDialog } from "./AddSongDialog";

interface SeasonCardProps {
  season: Season;
}

export function SeasonCard({ season }: SeasonCardProps) {
  const { data: songs } = useSongsBySeason(season.id);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const sortedSongs = [...songs].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

  return (
    <>
      <Card className="w-80 flex-shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{season.name}</span>
            <span className="text-sm font-normal text-muted-foreground">{songs.length}곡</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-[500px] pr-4">
            {sortedSongs.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">노래가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedSongs.map((song) => (
                  <SongItem key={song.id} song={song} />
                ))}
              </div>
            )}
          </ScrollArea>
          <Button className="w-full" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            노래 추가
          </Button>
        </CardContent>
      </Card>

      <AddSongDialog
        seasonId={season.id}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </>
  );
}
