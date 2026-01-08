"use client";
import { useState } from "react";
import { useSeasonLogic } from "@features/season/hooks/useSeasonLogic";
import { SeasonBoard } from "./SeasonBoard";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore } from "lucide-react";

export default function SeasonsContent() {
  const { activeSeasons, archivedSeasons } = useSeasonLogic();
  const [showArchived, setShowArchived] = useState(false);

  const filteredSeasons = showArchived ? archivedSeasons : activeSeasons;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-[calc(100vw-4rem)] p-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 min-h-[800px]">
          <div className="mb-6 flex items-center justify-start">
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
          </div>
          <SeasonBoard seasons={filteredSeasons} />
        </div>
      </div>
    </div>
  );
}
