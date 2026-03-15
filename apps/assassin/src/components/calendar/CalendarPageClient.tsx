"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import { ko } from "date-fns/locale";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarIcon, MapPin, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { AppNav } from "@/components/navigation/AppNav";
import { cn } from "@/libs/shadcn/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CalendarEventUpsertDialog } from "@/components/calendar/CalendarEventUpsertDialog";
import { useDeleteCalendarEvent } from "@/features/calendar/mutations/useDeleteCalendarEvent";
import { useCalendarEventLogic } from "@/features/calendar/hooks/useCalendarEventLogic";
import { useRealtimeCalendarEventSync } from "@/features/calendar/hooks/useRealtimeCalendarEventSync";
import type { CalendarEvent } from "@/features/calendar/schema";
import { RsvpButton } from "@/components/calendar/RsvpButton";
import { RsvpList } from "@/components/calendar/RsvpList";

type DialogState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; event: CalendarEvent }
  | { type: "delete"; event: CalendarEvent };

export function CalendarPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 항상 ?date= 파라미터가 있어야 함. 없으면 오늘 날짜로 맞춤
  const urlDate = useMemo(() => {
    const dateParam = searchParams?.get("date");
    const d = dateParam ? new Date(dateParam) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  }, [searchParams]);

  const year = urlDate.getFullYear();
  const month = urlDate.getMonth() + 1;

  useRealtimeCalendarEventSync();
  const { getEventsForDay } = useCalendarEventLogic(year, month);
  const deleteMutation = useDeleteCalendarEvent();

  const [selected, setSelected] = useState<Date | undefined>(urlDate);
  const [calendarMonth, setCalendarMonth] = useState<Date>(urlDate);
  const [dialogState, setDialogState] = useState<DialogState>({ type: "none" });

  // searchParams나 pathname이 바뀌어 urlDate가 갱신될 때 상태 동기화
  useEffect(() => {
    startTransition(() => {
      setSelected(urlDate);
      setCalendarMonth(urlDate);
    });
  }, [urlDate]);

  const updateUrlParamQuietly = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("date", `${y}-${m}-${d}`);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  };

  // 최초 로드 시 ?date= 파라미터가 없으면 url에 강제로 넣고 시작
  useEffect(() => {
    if (!searchParams?.has("date")) {
      updateUrlParamQuietly(new Date());
    }
  }, []);

  const handleMonthChange = (newMonth: Date) => {
    setCalendarMonth(newMonth);
    // 달 이동 시 1일로 설정
    const y = newMonth.getFullYear();
    const m = String(newMonth.getMonth() + 1).padStart(2, "0");

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("date", `${y}-${m}-01`);

    // 월이 바뀌면 새로운 데이터를 가져와야 하므로 router.replace
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelectDate = (newDate: Date | undefined) => {
    if (!newDate) return;
    setSelected(newDate);
    updateUrlParamQuietly(newDate);
  };

  const selectedEvents = useMemo(
    () => (selected ? getEventsForDay(selected) : []),
    [getEventsForDay, selected],
  );

  const openCreate = () => {
    setDialogState({ type: "create" });
  };

  const openEdit = (event: CalendarEvent) => {
    setDialogState({ type: "edit", event });
  };

  const openDelete = (event: CalendarEvent) => {
    setDialogState({ type: "delete", event });
  };

  const closeDialogs = () => {
    setDialogState({ type: "none" });
  };

  const handleConfirmDelete = async () => {
    if (dialogState.type !== "delete" || !dialogState.event?.id) return;
    await deleteMutation.mutateAsync(dialogState.event.id);
    closeDialogs();
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-0">
          <AppNav />

          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 flex-1 min-h-0 overflow-hidden">
            {/* 달력 */}
            <div className="flex-shrink-0">
              <Calendar
                mode="single"
                required
                month={calendarMonth}
                onMonthChange={handleMonthChange}
                selected={selected}
                onSelect={handleSelectDate}
                locale={ko}
                components={{
                  DayButton: ({ day, modifiers, children, ...props }) => {
                    const count = getEventsForDay(day.date).length;
                    const dotCount = Math.min(count, 3);
                    return (
                      <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                        {children}
                        {dotCount > 0 && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {Array.from({ length: dotCount }).map((_, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "w-1 h-1 rounded-full",
                                  modifiers.selected ? "bg-white dark:bg-slate-900" : "bg-blue-500",
                                )}
                              />
                            ))}
                          </span>
                        )}
                      </CalendarDayButton>
                    );
                  },
                }}
              />
            </div>

            {/* 구분선 */}
            <div className="hidden sm:block w-px self-stretch bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

            {/* 일정 목록 */}
            <div className="w-full sm:flex-1 min-h-0 flex flex-col">
              {/* 선택된 날짜 헤더 */}
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {selected
                    ? selected.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "날짜를 선택하세요"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={openCreate}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    일정 추가
                  </Button>
                  {selectedEvents.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border-0"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {selectedEvents.length}
                    </Badge>
                  )}
                </div>
              </div>

              {/* 이벤트 목록 */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {!selected || selectedEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CalendarIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">일정이 없습니다.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {selectedEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        selectedDate={selected}
                        onEdit={() => openEdit(event)}
                        onDelete={() => openDelete(event)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CalendarEventUpsertDialog
        key={`calendar-event-upsert-${dialogState.type}-${
          dialogState.type === "edit" ? dialogState.event.id : "new"
        }`}
        mode={dialogState.type === "edit" ? "edit" : "create"}
        open={dialogState.type === "create" || dialogState.type === "edit"}
        onOpenChange={(open) => {
          if (!open) closeDialogs();
        }}
        initialDate={selected}
        event={dialogState.type === "edit" ? dialogState.event : null}
      />

      <ConfirmDialog
        open={dialogState.type === "delete"}
        onOpenChange={(open) => {
          if (!open) closeDialogs();
        }}
        title="일정을 삭제할까요?"
        description={
          dialogState.type === "delete"
            ? `"${dialogState.event.title}" 일정이 삭제됩니다.`
            : undefined
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleConfirmDelete}
        isConfirming={deleteMutation.isPending}
        tone="destructive"
        icon={<Trash2 className="h-4 w-4" />}
      />
    </div>
  );
}

function getTimeLabel(event: CalendarEvent, selectedDate: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const startDay = new Date(start.toDateString());
  const endDay = new Date(end.toDateString());
  const thisDay = new Date(selectedDate.toDateString());

  const startsToday = startDay.getTime() === thisDay.getTime();
  const endsToday = endDay.getTime() === thisDay.getTime();

  const startOfDay = new Date(thisDay);
  const endOfDay = new Date(thisDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  if (startsToday && endsToday) return `${fmt(start)} ~ ${fmt(end)}`;
  if (startsToday) return `${fmt(start)} ~ ${fmt(endOfDay)}`;
  if (endsToday) return `${fmt(startOfDay)} ~ ${fmt(end)}`;
  return "종일";
}

function EventCard({
  event,
  selectedDate,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  selectedDate: Date;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 flex gap-3">
      <div className="w-0.5 rounded-full bg-blue-500 self-stretch flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
            {event.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              aria-label="일정 수정"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
              aria-label="일정 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{event.location}</p>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3 text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {getTimeLabel(event, selectedDate)}
          </p>
        </div>
        {/* RSVP 섹션 */}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-start justify-between gap-2">
          <RsvpList eventId={event.id} />
          <RsvpButton eventId={event.id} />
        </div>
      </div>
    </li>
  );
}
