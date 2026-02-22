"use client";

import { useMemo } from "react";
import { Calendar as CalendarIcon, MapPin, Clock, Loader2, Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/shadcn/utils";
import type { CalendarEvent } from "@/features/calendar/schema";
import { useCalendarEventHandlers } from "@/features/calendar/hooks/useCalendarEventHandlers";

type Mode = "create" | "edit";

interface CalendarEventUpsertDialogProps {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  event?: CalendarEvent | null;
}

function getDefaultStartEnd(initialDate?: Date) {
  const base = initialDate ? new Date(initialDate) : new Date();
  const start = new Date(base);
  start.setHours(9, 0, 0, 0);
  const end = new Date(base);
  end.setHours(10, 0, 0, 0);
  return { start, end };
}

export function CalendarEventUpsertDialog({
  mode,
  open,
  onOpenChange,
  initialDate,
  event,
}: CalendarEventUpsertDialogProps) {
  const initialData = useMemo(() => {
    if (mode === "edit" && event) {
      return {
        title: event.title ?? "",
        location: event.location ?? "",
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      };
    }
    const { start, end } = getDefaultStartEnd(initialDate);
    return {
      startDate: start,
      endDate: end,
    };
  }, [event, initialDate, mode]);

  const {
    formState,
    handleSubmit,
    handleChangeField,
    handleChangeStartValue,
    handleChangeEndValue,
    isProcessing,
  } = useCalendarEventHandlers(
    mode === "create"
      ? {
          mode: "create",
          initialData,
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      : {
          mode: "update",
          eventId: event?.id ?? "",
          initialData,
          onSuccess: () => {
            onOpenChange(false);
          },
        },
  );

  const { formData, startValue, endValue, errors, isValid } = formState;

  const inputClassName =
    "h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-sm placeholder:text-slate-400";

  const submitLabel = mode === "create" ? "추가하기" : "수정하기";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full max-w-[calc(100%-1.5rem)] sm:max-w-md p-0 gap-0 overflow-hidden",
          "bg-slate-50 dark:bg-slate-800",
          "border-slate-200 dark:border-slate-700",
        )}
      >
        <DialogHeader className="px-4 sm:px-5 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-500">
              {mode === "create" ? (
                <CalendarIcon className="h-4 w-4 text-white" />
              ) : (
                <Pencil className="h-4 w-4 text-white" />
              )}
            </div>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {mode === "create" ? "일정 추가" : "일정 수정"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="px-4 sm:px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                <CalendarIcon className="h-3.5 w-3.5" />
                제목 <span className="text-blue-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChangeField("title", e.target.value)}
                placeholder="예: 리허설"
                className={inputClassName}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                장소 <span className="text-blue-500">*</span>
              </label>
              <Input
                value={formData.location}
                onChange={(e) => handleChangeField("location", e.target.value)}
                placeholder="예: 합주실 A"
                className={inputClassName}
              />
              {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  시작 <span className="text-blue-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={startValue}
                  onChange={(e) => handleChangeStartValue(e.target.value)}
                  className={inputClassName}
                />
                {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  종료 <span className="text-blue-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={endValue}
                  onChange={(e) => handleChangeEndValue(e.target.value)}
                  className={inputClassName}
                />
                {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
                {formData.startDate &&
                  formData.endDate &&
                  formData.endDate.getTime() < formData.startDate.getTime() && (
                    <p className="text-xs text-red-500">
                      종료 시간이 시작 시간보다 빠를 수 없어요.
                    </p>
                  )}
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-5 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isValid || isProcessing}
              className="bg-blue-500 hover:bg-blue-600 text-white min-w-[90px] w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  {mode === "create" ? (
                    <Plus className="h-3.5 w-3.5" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
