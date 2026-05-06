"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateSeason } from "@/features/season/mutations/useCreateSeason";

interface AddSeasonCardProps {
  nextSortOrder: number;
}

export function AddSeasonCard({ nextSortOrder }: AddSeasonCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const createSeason = useCreateSeason();

  const handleSave = async () => {
    if (!name.trim() || createSeason.isPending) return;
    try {
      await createSeason.mutateAsync({
        name: name.trim(),
        sortOrder: nextSortOrder,
        isArchived: false,
      });
      setName("");
      setIsEditing(false);
    } catch {
      // stay in edit mode on error
    }
  };

  const handleCancel = () => {
    setName("");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") handleCancel();
  };

  if (isEditing) {
    return (
      <div className="min-w-0 flex-shrink-0 w-full">
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
          <div className="p-4">
            <div className="flex items-center gap-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="시즌 이름..."
                className="h-7 text-sm border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                autoFocus
              />
              <Button
                size="icon"
                className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
                onClick={handleSave}
                disabled={!name.trim() || createSeason.isPending}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex-shrink-0"
                onClick={handleCancel}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-shrink-0 w-full">
      <button
        onClick={() => setIsEditing(true)}
        className="w-full h-full min-h-[80px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors flex items-center justify-center group"
      >
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors">
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">New Season</span>
        </div>
      </button>
    </div>
  );
}
