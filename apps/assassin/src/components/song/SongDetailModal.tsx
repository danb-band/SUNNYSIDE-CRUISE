"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Music } from "lucide-react";
import { cn } from "@/libs/shadcn/utils";
import { SongDetailContent, extractYoutubeId } from "./SongDetailContent";
import { CommentSection } from "@/components/comment/CommentSection";
import { PlayerSection } from "@/components/player/PlayerSection";
import { PlayerSectionSkeleton } from "@/components/player/PlayerSectionSkeleton";
import type { Song } from "@features/song/schema";
import type { Player } from "@/features/player/schema";

interface SongDetailModalProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlayers?: Player[];
}

export function SongDetailModal({
  song,
  open,
  onOpenChange,
  initialPlayers,
}: SongDetailModalProps) {
  const youtubeId = extractYoutubeId(song.youtubeUrl);
  const pathname = usePathname();
  const isActiveRoute = pathname === `/song/${song.id}`;
  const shouldRenderIframe = Boolean(youtubeId && isActiveRoute);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full max-w-[calc(100%-1.5rem)] sm:max-w-2xl md:max-w-5xl p-0 gap-0 overflow-hidden",
          "bg-slate-50 dark:bg-slate-800",
          "border-slate-200 dark:border-slate-700",
        )}
      >
        <DialogHeader className="px-4 sm:px-5 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-500">
              <Music className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-base font-semibold text-slate-900 text-start dark:text-slate-50 truncate min-w-0 flex-1">
              {song.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div
          className={cn(
            "h-[75vh]",
            "flex flex-col overflow-y-auto",
            "md:grid md:grid-cols-[4fr_1px_2fr] md:grid-rows-[auto_1px_1fr] md:overflow-hidden",
          )}
        >
          {/* YouTube - 왼쪽 상단 */}
          {shouldRenderIframe && (
            <div className="shrink-0 md:col-start-1 md:row-start-1">
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* 오른쪽 패널 (Song 정보 + Players) - 데스크탑에서는 Top Right 고정 */}
          <div
            className={cn(
              "shrink-0",
              "md:col-start-3 md:row-start-1",
              "md:relative", // 부모에 relative
              // 모바일에서는 그냥 흐름대로 나옴
            )}
          >
            <div className="md:absolute md:inset-0 flex flex-col h-full overflow-hidden">
              {/* 상단 고정 영역 (곡 정보) */}
              <div className="shrink-0">
                <SongDetailContent song={song} onClose={() => onOpenChange(false)} />
                <Separator />
              </div>

              {/* 스크롤 영역 (연주자 목록) */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <Suspense fallback={<PlayerSectionSkeleton />}>
                  <PlayerSection songId={song.id} initialPlayers={initialPlayers} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* 수직 구분선 - 데스크탑 상단만 (Video와 Info 사이) */}
          <Separator
            orientation="vertical"
            className="hidden md:block md:col-start-2 md:row-start-1 md:h-full"
          />

          {/* 수평 구분선 - 데스크탑 (Row 1과 Row 2 사이) & 모바일 */}
          <Separator className="shrink-0 md:col-span-3 md:row-start-2" />

          {/* 댓글 - 데스크탑 하단 전체 (Full Width) */}
          <div className="flex-1 min-h-0 md:col-start-1 md:col-span-3 md:row-start-3 md:overflow-hidden">
            {/* CommentSection 내부에서 스크롤을 쓰기 위해 부모는 overflow-hidden & flex 컨텍스트 제공 */}
            <div className="md:h-full md:flex md:flex-col md:overflow-hidden">
              <CommentSection songId={song.id} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
