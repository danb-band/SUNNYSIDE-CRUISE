"use client";

import { useState } from "react";
import { Season } from "@features/season/schema";
import { useUpdateSeason } from "@features/season/mutations/useUpdateSeason";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, Music, Plus, Pencil, Check, X, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SeasonColumnProps {
  season: Season;
  songCount?: number;
}

export function SeasonColumn({ season, songCount = 0 }: SeasonColumnProps) {
  const isArchived = season.isArchived;
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(season.name);
  const updateSeason = useUpdateSeason();

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
      console.log(error);
      console.error("Failed to toggle archive status:", error);
    }
  };

  return (
    <div className="w-80 flex-shrink-0">
      <Card
        className={`border-slate-200 dark:border-slate-700 shadow-sm transition-all ${
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
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Songs Container */}
          <div className="min-h-[500px] max-h-[600px] overflow-y-auto rounded-md bg-slate-50 dark:bg-slate-900 p-3 space-y-2">
            {songCount === 0 ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="text-center">
                  <Music className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No songs yet</p>
                  <Button size="sm" className="text-xs bg-blue-500 hover:bg-blue-600 text-white">
                    <Plus className="mr-1 h-3 w-3" />
                    Add song
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">{/* Placeholder for future song items */}</div>
            )}
          </div>

          {/* Add Song Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add a song
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
