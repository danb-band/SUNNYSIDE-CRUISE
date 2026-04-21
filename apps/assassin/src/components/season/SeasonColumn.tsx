"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Season } from "@features/season/schema";
import type { Song } from "@features/song/schema";
import { useUpdateSeason } from "@features/season/mutations/useUpdateSeason";
import { useDeleteSeason } from "@features/season/mutations/useDeleteSeason";
import { useOrgRole } from "@libs/org/OrgProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, Music, Plus, Pencil, Check, X, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { SortableSongItem } from "../song/SortableSongItem";
import { SongItem } from "../song/SongItem";
import { useSongLogic } from "@/features/song/hooks/useSongLogic";
import { AddSongDialog } from "../song/AddSongDialog";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { cn } from "@/libs/shadcn/utils";
import { getSeasonDroppableId } from "@/features/song/hooks/useSongDragDrop";

interface SeasonColumnProps {
  season: Season;
  variant?: "carousel" | "grid";
}

export function SeasonColumn({ season, variant = "grid" }: SeasonColumnProps) {
  const dragEnabled = variant !== "carousel";
  const isArchived = season.isArchived;
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(season.name);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const updateSeason = useUpdateSeason();
  const deleteSeason = useDeleteSeason();
  const role = useOrgRole();

  const { songs } = useSongLogic(season.id);
  const songCount = songs.length;

  const handleSave = async () => {
    if (editedName.trim() === "" || editedName === season.name) {
      setIsEditing(false);
      return;
    }

    try {
      await updateSeason.mutateAsync({
        id: season.id,
        data: {
          name: editedName,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update season name:", error);
      // 에러 시 원래 이름으로 복구
      setEditedName(season.name);
    }
  };

  const handleCancel = () => {
    setEditedName(season.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleToggleArchive = async () => {
    try {
      await updateSeason.mutateAsync({
        id: season.id,
        data: {
          isArchived: !isArchived,
        },
      });
    } catch (error) {
      console.error("Failed to toggle archive status:", error);
    }
  };

  return (
    <div
      className={`min-w-0 flex-shrink-0 ${
        variant === "carousel" ? "w-full snap-center" : "w-full"
      }`}
    >
      <Card
        className={`border-slate-200 dark:border-slate-700 shadow-sm transition-all h-full flex flex-col min-h-0 ${
          isArchived ? "bg-slate-100 dark:bg-slate-800/50 opacity-75" : "bg-white dark:bg-slate-800"
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-7 text-sm border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
                    onClick={handleSave}
                    disabled={updateSeason.isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-500 hover:text-slate-900 flex-shrink-0"
                    onClick={handleCancel}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h3
                    className={`font-semibold text-base truncate ${
                      isArchived
                        ? "text-slate-500 dark:text-slate-400"
                        : "text-slate-900 dark:text-slate-50"
                    }`}
                  >
                    {season.name}
                  </h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border-0"
                >
                  <Music className="mr-1 h-3 w-3" />
                  {songCount}
                </Badge>
                {isArchived && (
                  <Badge
                    variant="outline"
                    className="text-xs border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400"
                  >
                    <Archive className="mr-1 h-3 w-3" />
                    Archived
                  </Badge>
                )}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
              onClick={handleToggleArchive}
              disabled={updateSeason.isPending}
              title={isArchived ? "Unarchive season" : "Archive season"}
            >
              {isArchived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>

            {role === "OWNER" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleteSeason.isPending}
                title="Delete season"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex flex-col flex-1 min-h-0">
          {/* Songs Container */}
          {dragEnabled ? (
            <SeasonSongListDrag
              seasonId={season.id}
              songs={songs}
              songCount={songCount}
              onAdd={() => setIsAddDialogOpen(true)}
            />
          ) : (
            <SeasonSongListStatic
              songs={songs}
              songCount={songCount}
              onAdd={() => setIsAddDialogOpen(true)}
            />
          )}

          {/* Add Song Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add a song
          </Button>
        </CardContent>
      </Card>

      <AddSongDialog
        seasonId={season.id}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={() => setIsAddDialogOpen(false)}
      />
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="시즌 삭제"
        description={`"${season.name}" 시즌을 삭제하면 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        onConfirm={() => deleteSeason.mutate(season.id)}
        isConfirming={deleteSeason.isPending}
        icon={<Trash2 className="h-4 w-4" />}
      />
    </div>
  );
}

interface SeasonSongListProps {
  songs: Song[];
  songCount: number;
  onAdd: () => void;
}

interface SeasonSongListDragProps extends SeasonSongListProps {
  seasonId: string;
}

function SeasonSongListDrag({ seasonId, songs, songCount, onAdd }: SeasonSongListDragProps) {
  const { setNodeRef, isOver } = useDroppable({ id: getSeasonDroppableId(seasonId) });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto scrollbar-hidden rounded-md bg-slate-50 dark:bg-slate-900 p-3 sm:p-4",
        isOver && "ring-2 ring-blue-200/80 dark:ring-blue-500/40",
      )}
    >
      <SortableContext items={songs.map((song) => song.id)} strategy={verticalListSortingStrategy}>
        {songCount === 0 ? (
          <EmptySongState onAdd={onAdd} />
        ) : (
          <div className="space-y-2">
            {songs.map((song) => (
              <SortableSongItem key={song.id} song={song} />
            ))}
          </div>
        )}
      </SortableContext>
    </div>
  );
}

function SeasonSongListStatic({ songs, songCount, onAdd }: SeasonSongListProps) {
  const router = useRouter();
  const params = useParams<{ orgSlug?: string }>();

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden rounded-md bg-slate-50 dark:bg-slate-900 p-3 sm:p-4">
      {songCount === 0 ? (
        <EmptySongState onAdd={onAdd} />
      ) : (
        <div className="space-y-2">
          {songs.map((song) => (
            <SongItem
              key={song.id}
              song={song}
              onClick={() =>
                router.push(
                  params.orgSlug ? `/org/${params.orgSlug}/song/${song.id}` : `/song/${song.id}`,
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptySongState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <Music className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No songs yet</p>
        <Button
          size="sm"
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white"
          onClick={onAdd}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add song
        </Button>
      </div>
    </div>
  );
}
