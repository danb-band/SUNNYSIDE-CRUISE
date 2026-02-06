"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Save, X, Loader2 } from "lucide-react";
import { cn } from "@/libs/shadcn/utils";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useCommentHandlers } from "@/features/comment/hooks/useCommentHandlers";
import type { Comment } from "@/features/comment/schema";

interface CommentItemProps {
  comment: Comment;
  isOwner: boolean;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return target.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CommentItem({ comment, isOwner }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const savedContentRef = useRef(comment.content);

  const { formState, handleSubmit, handleChangeField, handleDeleteComment, isProcessing } =
    useCommentHandlers({
      mode: "update",
      commentId: comment.id,
      initialData: { songId: comment.songId, content: comment.content },
    });

  const { formData } = formState;

  const handleStartEditing = useCallback(() => {
    savedContentRef.current = comment.content;
    handleChangeField("content", comment.content);
    setIsEditing(true);
  }, [comment.content, handleChangeField]);

  const handleSave = useCallback(async () => {
    const result = await handleSubmit();
    if (result.success) {
      setIsEditing(false);
    }
  }, [handleSubmit]);

  const handleCancel = useCallback(() => {
    handleChangeField("content", savedContentRef.current);
    setIsEditing(false);
  }, [handleChangeField]);

  const handleRequestDelete = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    await handleDeleteComment(comment.id, comment.songId);
    setIsDeleteDialogOpen(false);
  }, [handleDeleteComment, comment.id, comment.songId]);

  if (isEditing) {
    return (
      <>
        <div className="space-y-2">
          <Textarea
            value={formData.content}
            onChange={(e) => handleChangeField("content", e.target.value)}
            className={cn(
              "min-h-[60px] resize-none text-sm",
              "bg-white dark:bg-slate-900",
              "border-slate-200 dark:border-slate-700",
              "focus:border-blue-500 focus:ring-blue-500/20",
            )}
          />
          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isProcessing}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isProcessing || !formData.content.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isProcessing ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1 h-3.5 w-3.5" />
              )}
              저장
            </Button>
          </div>
        </div>
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="댓글 삭제"
          description="이 댓글을 삭제하면 되돌릴 수 없습니다."
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
      <div className="group flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {comment.profile.name}
          </span>
          <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words mt-0.5">
            {comment.content}
          </p>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        {isOwner && (
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
        )}
      </div>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="댓글 삭제"
        description="이 댓글을 삭제하면 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleConfirmDelete}
        isConfirming={isProcessing}
        icon={<Trash2 className="h-4 w-4" />}
      />
    </>
  );
}
