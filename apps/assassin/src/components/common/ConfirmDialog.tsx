"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/shadcn/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isConfirming?: boolean;
  tone?: "destructive" | "default";
  icon?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  isConfirming = false,
  tone = "destructive",
  icon,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full max-w-[calc(100%-1.5rem)] sm:max-w-sm p-0 gap-0 overflow-hidden",
          "bg-slate-50 dark:bg-slate-800",
          "border-slate-100 dark:border-slate-700/60",
          "transition-shadow duration-200 hover:shadow-xl",
        )}
      >
        <DialogHeader className="px-4 sm:px-5 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/60 text-left">
          <div className="flex items-start gap-3">
            {icon && (
              <div
                className={cn(
                  "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg",
                  tone === "destructive" ? "bg-red-500" : "bg-blue-500",
                )}
              >
                <span className="text-white">{icon}</span>
              </div>
            )}
            <div className="min-w-0 text-left">
              <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-50 text-left">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 text-left">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isConfirming}
              className="w-full sm:w-auto hover:cursor-pointer"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={tone === "destructive" ? "destructive" : "default"}
              size="sm"
              onClick={onConfirm}
              disabled={isConfirming}
              className={cn(
                "w-full sm:w-auto",
                "hover:cursor-pointer",
                tone === "destructive" && "bg-red-500 hover:bg-red-600 text-white",
              )}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
