"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Save, X, Loader2 } from "lucide-react";
import { cn } from "@/libs/shadcn/utils";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { usePlayerHandlers } from "@/features/player/hooks/usePlayerHandlers";
import type { Player, Instrument } from "@/features/player/schema";
import { INSTRUMENT_LABELS, INSTRUMENT_COLORS } from "./constants";
import { UserSearchInput } from "./UserSearchInput";

interface PlayerItemProps {
  player: Player;
}

export function PlayerItem({ player }: PlayerItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const savedDataRef = useRef({ instrument: player.instrument, userId: player.userId });

  const { formState, handleSubmit, handleChangeField, handleDeletePlayer, isProcessing } =
    usePlayerHandlers({
      mode: "update",
      playerId: player.id,
      initialData: {
        songId: player.songId,
        userId: player.userId,
        instrument: player.instrument,
      },
    });

  const { formData, errors } = formState;

  const handleStartEditing = useCallback(() => {
    savedDataRef.current = { instrument: player.instrument, userId: player.userId };
    handleChangeField("instrument", player.instrument);
    handleChangeField("userId", player.userId);
    setIsEditing(true);
  }, [player.instrument, player.userId, handleChangeField]);

  const handleSave = useCallback(async () => {
    const result = await handleSubmit();
    if (result.success) {
      setIsEditing(false);
    }
  }, [handleSubmit]);

  const handleCancel = useCallback(() => {
    handleChangeField("instrument", savedDataRef.current.instrument);
    handleChangeField("userId", savedDataRef.current.userId);
    setIsEditing(false);
  }, [handleChangeField]);

  const handleRequestDelete = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    await handleDeletePlayer(player.id, player.songId);
    setIsDeleteDialogOpen(false);
  }, [handleDeletePlayer, player.id, player.songId]);

  if (isEditing) {
    return (
      <>
        <div className="space-y-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
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
            <UserSearchInput
              songId={player.songId}
              value={(formData.userId as string) ?? ""}
              onChange={(userId) => handleChangeField("userId", userId)}
              placeholder="이름 검색"
            />
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                disabled={isProcessing}
                className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={handleSave}
                disabled={isProcessing}
                className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {(errors.instrument || errors.userId || errors._root) && (
            <p className="text-xs text-red-500">
              {errors.instrument || errors.userId || errors._root}
            </p>
          )}
        </div>
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="연주자 삭제"
          description="이 연주자를 삭제하면 되돌릴 수 없습니다."
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleConfirmDelete}
          isConfirming={isProcessing}
          icon={<Trash2 className="h-4 w-4" />}
        />
      </>
    );
  }

  return (
    <>
      <div className="group flex items-center justify-between gap-2 py-1">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="secondary"
            className={cn("shrink-0 pointer-events-none", INSTRUMENT_COLORS[player.instrument])}
          >
            {INSTRUMENT_LABELS[player.instrument]}
          </Badge>
          <span className="text-sm text-slate-800 dark:text-slate-200 truncate">
            {player.profile?.realName ?? "알 수 없는 플레이어"}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            onClick={handleStartEditing}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
            onClick={handleRequestDelete}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="연주자 삭제"
        description="이 연주자를 삭제하면 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleConfirmDelete}
        isConfirming={isProcessing}
        icon={<Trash2 className="h-4 w-4" />}
      />
    </>
  );
}
