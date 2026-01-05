"use client";

import { Season } from "@features/season/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SeasonColumn } from "./SeasonColumn";

interface SeasonBoardProps {
  seasons: Season[];
}

export function SeasonBoard({ seasons }: SeasonBoardProps) {
  const sortedSeasons = [...seasons].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

  return (
    <div className="min-h-[700px]">
      {sortedSeasons.length === 0 ? (
        <div className="flex h-[700px] w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="text-center space-y-4 p-8">
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
              No seasons yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Create your first season to get started
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap pb-4 h-[700px]">
          <div className="flex gap-4 px-1 h-full">
            {sortedSeasons.map((season) => (
              <SeasonColumn key={season.id} season={season} songCount={0} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
