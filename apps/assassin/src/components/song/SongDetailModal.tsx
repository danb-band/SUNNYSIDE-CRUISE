"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Music } from "lucide-react";
import { cn } from "@/libs/shadcn/utils";
import { SongDetailContent } from "./SongDetailContent";
import type { Song } from "@features/song/schema";

interface SongDetailModalProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SongDetailModal({ song, open, onOpenChange }: SongDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full max-w-[calc(100%-1.5rem)] sm:max-w-2xl p-0 gap-0 overflow-hidden",
          "bg-slate-50 dark:bg-slate-800",
          "border-slate-200 dark:border-slate-700",
        )}
      >
        <DialogHeader className="px-4 sm:px-5 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-500">
              <Music className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {song.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col max-h-[75vh] overflow-y-auto">
          <SongDetailContent song={song} onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
