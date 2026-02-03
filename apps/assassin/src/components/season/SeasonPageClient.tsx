"use client";

import { useState } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeasonBoard } from "./SeasonBoard";
import { LogoutButton } from "@/components/common/LogoutButton";
import type { Season } from "@features/season/schema";
import type { Song } from "@features/song/schema";

interface SeasonPageClientProps {
  seasons: Season[];
  songsBySeason: Record<string, Song[]>;
}

export function SeasonPageClient({
  seasons: initialSeasons,
  songsBySeason,
}: SeasonPageClientProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [seasons, setSeasons] = useState(initialSeasons);

  const activeSeasons = seasons.filter((s) => !s.isArchived);
  const archivedSeasons = seasons.filter((s) => s.isArchived);
  const displayedSeasons = showArchived ? archivedSeasons : activeSeasons;

  const handleArchive = (season: Season) => {
    setSeasons((prev) => prev.map((s) => (s.id === season.id ? { ...s, isArchived: true } : s)));
  };

  const handleRestore = (season: Season) => {
    setSeasons((prev) => prev.map((s) => (s.id === season.id ? { ...s, isArchived: false } : s)));
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-0">
          <div className="mb-4 sm:mb-6 flex items-center justify-between flex-shrink-0">
            <Button
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {showArchived ? (
                <>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Show Active
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Show Archived
                </>
              )}
            </Button>
            <LogoutButton />
          </div>
          <div className="flex-1 min-h-0">
            <SeasonBoard
              seasons={displayedSeasons}
              songsBySeason={songsBySeason}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
