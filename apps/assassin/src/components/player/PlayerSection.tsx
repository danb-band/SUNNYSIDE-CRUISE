"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { usePlayerLogic } from "@/features/player/hooks/usePlayerLogic";
import { PlayerInput } from "./PlayerInput";
import { PlayerItem } from "./PlayerItem";
import type { Player } from "@/features/player/schema";
import { useRealtimePlayerSync } from "@/features/player/hooks/useRealtimePlayerSync";

interface PlayerSectionProps {
  songId: string;
  initialPlayers?: Player[];
}

export function PlayerSection({ songId, initialPlayers }: PlayerSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { players } = usePlayerLogic(songId, initialPlayers);
  useRealtimePlayerSync();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 고정된 헤더 영역 */}
      <div className="px-4 sm:px-5 pt-4 pb-2 shrink-0 bg-white dark:bg-slate-800 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">연주자</h3>
            {players.length > 0 && <span className="text-xs text-slate-400">{players.length}</span>}
          </div>
          {!isAdding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="h-7 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              추가
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="mb-1">
            <PlayerInput songId={songId} onComplete={() => setIsAdding(false)} />
          </div>
        )}
      </div>

      {/* 스크롤 가능한 목록 영역 */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-5 pb-4">
        {players.length === 0 && !isAdding ? (
          <p className="text-center text-sm text-slate-400 py-4">아직 연주자가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <PlayerItem key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
