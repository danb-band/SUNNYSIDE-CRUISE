"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/libs/shadcn/utils";
import { usePlayerHandlers } from "@/features/player/hooks/usePlayerHandlers";
import type { Instrument } from "@/features/player/schema";
import { INSTRUMENT_LABELS, INSTRUMENT_COLORS } from "./constants";

interface PlayerInputProps {
  songId: string;
  onComplete: () => void;
}

export function PlayerInput({ songId, onComplete }: PlayerInputProps) {
  const { formState, handleSubmit, handleChangeField, isProcessing } = usePlayerHandlers({
    mode: "create",
    initialData: { songId },
  });

  const { formData, errors } = formState;

  const handleAdd = async () => {
    const result = await handleSubmit();
    if (result.success) {
      onComplete();
    }
  };

  const inputClassName =
    "h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-sm placeholder:text-slate-400";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(INSTRUMENT_LABELS) as Instrument[]).map((key) => {
          const isSelected = formData.instrument === key;
          return (
            <Badge
              key={key}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all",
                isSelected
                  ? INSTRUMENT_COLORS[key]
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800",
              )}
              onClick={() => handleChangeField("instrument", key)}
            >
              {INSTRUMENT_LABELS[key]}
            </Badge>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={formData.name ?? ""}
          onChange={(e) => handleChangeField("name", e.target.value)}
          placeholder="이름 (ex. 김철수)"
          className={cn(inputClassName, "flex-1")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={isProcessing}
          className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onComplete}
          disabled={isProcessing}
          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {(errors.instrument || errors.name || errors._root) && (
        <p className="text-xs text-red-500">{errors.instrument || errors.name || errors._root}</p>
      )}
    </div>
  );
}
