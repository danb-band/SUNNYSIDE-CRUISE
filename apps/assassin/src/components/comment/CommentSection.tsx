"use client";

import { useEffect, useRef, useCallback } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useInfiniteCommentsBySong } from "@/features/comment/queries/useInfiniteCommentsBySong";
import { useCurrentUserId } from "@/features/comment/hooks/useCurrentUserId";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  songId: string;
}

export function CommentSection({ songId }: CommentSectionProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteCommentsBySong(songId);
  const currentUserId = useCurrentUserId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollRef.current;
    if (!sentinel || !scrollContainer) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root: scrollContainer,
      threshold: 0,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];

  return (
    <div className="flex flex-col min-h-0 flex-1 px-4 sm:px-5 py-4">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <MessageSquare className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">댓글</h3>
      </div>

      <div className="shrink-0">
        <CommentInput songId={songId} />
      </div>

      <div ref={scrollRef} className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-4">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwner={currentUserId === comment.userId}
            />
          ))
        )}

        <div ref={sentinelRef} className="h-1" />

        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}
