import { Season } from "@features/season/schema";
import { SeasonColumn } from "./SeasonColumn";
import { AddSeasonCard } from "./AddSeasonCard";
import { useRealtimeSongsBySeasonSync } from "@/features/song/hooks/useRealtimeSongSync";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { useSongDragDrop } from "@/features/song/hooks/useSongDragDrop";
import { SongItem } from "../song/SongItem";

interface SeasonBoardProps {
  seasons: Season[];
  canCreate?: boolean;
}

export function SeasonBoard({ seasons, canCreate = false }: SeasonBoardProps) {
  const sortedSeasons = [...seasons].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
  const nextSortOrder = sortedSeasons.length;
  useRealtimeSongsBySeasonSync(sortedSeasons.map((season) => season.id));
  const { sensors, activeSong, handleDragStart, handleDragCancel, handleDragEnd } = useSongDragDrop(
    { seasonIds: sortedSeasons.map((season) => season.id) },
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full min-h-0 overflow-hidden">
        {sortedSeasons.length === 0 && !canCreate ? (
          <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="text-center space-y-3 sm:space-y-4 p-6 sm:p-8">
              <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100">
                No seasons yet
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 sm:mt-2">
                Create your first season to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-0">
            <div className="flex h-full overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth sm:hidden">
              {sortedSeasons.map((season) => (
                <SeasonColumn key={season.id} season={season} variant="carousel" />
              ))}
              {canCreate && <AddSeasonCard nextSortOrder={nextSortOrder} />}
            </div>
            <div className="hidden h-full min-h-0 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 auto-rows-fr sm:grid">
              {sortedSeasons.map((season) => (
                <SeasonColumn key={season.id} season={season} />
              ))}
              {canCreate && <AddSeasonCard nextSortOrder={nextSortOrder} />}
            </div>
          </div>
        )}
      </div>
      <DragOverlay>
        {activeSong ? (
          <SongItem
            song={activeSong}
            className="shadow-xl ring-2 ring-blue-400/60 cursor-grabbing"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
