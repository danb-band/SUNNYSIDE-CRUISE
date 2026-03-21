"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getSeasonsAction } from "@/features/season/actions";
import { getSongsBySeasonAction } from "@/features/song/actions";
import { useAddEventSong } from "@/features/eventSong/mutations/useAddEventSong";
import { useSongsByEvent } from "@/features/eventSong/queries/useSongsByEvent";
import { seasonKeys } from "@/features/season/queries/keys";
import { songKeys } from "@/features/song/queries/keys";

const selectClassName =
  "h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";

export function EventSongAddForm({ eventId }: { eventId: string }) {
  const { data: eventSongs = [] } = useSongsByEvent(eventId);
  const addedSongIds = eventSongs.map((es) => es.songId);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedSongId, setSelectedSongId] = useState("");

  const { data: seasons = [] } = useQuery({
    queryKey: seasonKeys.lists(),
    queryFn: getSeasonsAction,
    staleTime: 1000 * 60,
  });

  const { data: songs = [] } = useQuery({
    queryKey: songKeys.bySeason(selectedSeasonId),
    queryFn: () => getSongsBySeasonAction(selectedSeasonId),
    enabled: !!selectedSeasonId,
    staleTime: 1000 * 60,
  });

  const { mutate: addSong, isPending } = useAddEventSong();

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setSelectedSongId("");
  };

  const handleAdd = () => {
    if (!selectedSongId) return;
    addSong(
      { eventId, songId: selectedSongId },
      {
        onSuccess: () => {
          setSelectedSongId("");
        },
      },
    );
  };

  return (
    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">곡 추가</span>
      </div>
      <div className="flex gap-2">
        <select
          value={selectedSeasonId}
          onChange={(e) => handleSeasonChange(e.target.value)}
          className={selectClassName}
          aria-label="시즌 선택"
        >
          <option value="">시즌 선택</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSongId}
          onChange={(e) => setSelectedSongId(e.target.value)}
          disabled={!selectedSeasonId}
          className={selectClassName}
          aria-label="곡 선택"
        >
          <option value="">곡 선택</option>
          {songs.map((song) => (
            <option key={song.id} value={song.id} disabled={addedSongIds.includes(song.id)}>
              {song.name} — {song.artist}
            </option>
          ))}
        </select>

        <Button
          type="button"
          size="sm"
          disabled={!selectedSongId || isPending}
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
          aria-label="곡 추가"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
