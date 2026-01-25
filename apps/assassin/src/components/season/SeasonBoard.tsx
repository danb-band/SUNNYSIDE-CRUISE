import { Season } from "@features/season/schema";
import { SeasonColumn } from "./SeasonColumn";
import type { Song } from "@features/song/schema";

interface SeasonBoardProps {
  seasons: Season[];
  songsBySeason: Record<string, Song[]>;
  onArchive: (season: Season) => void;
  onRestore: (season: Season) => void;
}

export function SeasonBoard({ seasons, songsBySeason, onArchive, onRestore }: SeasonBoardProps) {
  const sortedSeasons = [...seasons].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

  return (
    <div className="h-full min-h-0">
      {sortedSeasons.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="text-center space-y-4 p-8">
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No seasons yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Create your first season to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="h-full min-h-0 grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {sortedSeasons.map((season) => (
            <SeasonColumn
              key={season.id}
              season={season}
              initialSongs={songsBySeason[season.id] ?? []}
              onArchive={onArchive}
              onRestore={onRestore}
            />
          ))}
        </div>
      )}
    </div>
  );
}
