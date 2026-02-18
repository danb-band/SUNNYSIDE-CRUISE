"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/shadcn/utils";
import { useSongLiked } from "@/features/songLike/queries/useSongLiked";
import { useToggleLike } from "@/features/songLike/mutations/useToggleLike";
import type { Song } from "@features/song/schema";

interface LikeButtonProps {
  song: Song;
}

export function LikeButton({ song }: LikeButtonProps) {
  const { data: liked = false } = useSongLiked(song.id);
  const { mutate: toggleLike, isPending } = useToggleLike(song.id);

  return (
    <button
      type="button"
      onClick={() => toggleLike()}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50",
        liked ? "text-red-500 hover:text-red-600" : "text-slate-400 hover:text-red-500",
      )}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <Heart className={cn("h-4 w-4 transition-all", liked && "fill-current")} />
      <span className="tabular-nums">{song.likeCount}</span>
    </button>
  );
}
