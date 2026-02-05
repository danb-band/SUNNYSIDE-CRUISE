"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/libs/shadcn/utils";
import { useCommentHandlers } from "@/features/comment/hooks/useCommentHandlers";

interface CommentInputProps {
  songId: string;
}

export function CommentInput({ songId }: CommentInputProps) {
  const { formState, handleSubmit, handleChangeField, isProcessing } = useCommentHandlers({
    mode: "create",
    initialData: { songId },
  });

  const { formData } = formState;

  const onSubmit = useCallback(async () => {
    const result = await handleSubmit();
    if (result.success) {
      handleChangeField("content", "");
    }
  }, [handleSubmit, handleChangeField]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (formData.content.trim() && !isProcessing) {
          onSubmit();
        }
      }
    },
    [formData.content, isProcessing, onSubmit],
  );

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={formData.content}
        onChange={(e) => handleChangeField("content", e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="댓글을 입력하세요..."
        className={cn(
          "min-h-[40px] max-h-[120px] resize-none text-sm",
          "bg-white dark:bg-slate-900",
          "border-slate-200 dark:border-slate-700",
          "focus:border-blue-500 focus:ring-blue-500/20",
        )}
        rows={1}
      />
      <Button
        size="sm"
        onClick={onSubmit}
        disabled={!formData.content.trim() || isProcessing}
        className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );
}
