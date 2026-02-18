"use client";

import { useEffect, useState, startTransition } from "react";
import { ko } from "date-fns/locale";
import { CalendarIcon, MapPin, Clock } from "lucide-react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { TabNav } from "@/components/common/TabNav";
import { LogoutButton } from "@/components/common/LogoutButton";
import { useCalendarEvents } from "@/features/calendar/queries/useCalendarEvents";
import type { CalendarEvent } from "@/features/calendar/schema";
import { cn } from "@/libs/shadcn/utils";

function getEventsForDay(events: CalendarEvent[], date: Date) {
  return events.filter((e) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return date >= new Date(start.toDateString()) && date <= new Date(end.toDateString());
  });
}

export function CalendarPageClient() {
  const { data: events } = useCalendarEvents();
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  // 클라이언트에서만 오늘 날짜로 초기화 (hydration mismatch 방지)
  // startTransition: non-urgent 업데이트임을 명시
  useEffect(() => {
    startTransition(() => setSelected(new Date()));
  }, []);

  const selectedEvents = selected ? getEventsForDay(events, selected) : [];

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-0">
          <TabNav />
          <div className="mb-4 flex items-center justify-end flex-shrink-0">
            <LogoutButton />
          </div>

          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 flex-1 min-h-0 overflow-hidden">
            {/* 달력 */}
            <div className="flex-shrink-0">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={setSelected}
                locale={ko}
                components={{
                  DayButton: ({ day, modifiers, children, ...props }) => {
                    const count = getEventsForDay(events, day.date).length;
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
            <div className="w-full sm:flex-1 min-h-0 overflow-y-auto">
              {/* 선택된 날짜 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {selected
                    ? selected.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "날짜를 선택하세요"}
                </p>
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

              {/* 이벤트 목록 */}
              {selectedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">일정이 없습니다.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  return (
    <li className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 flex gap-3">
      <div className="w-0.5 rounded-full bg-blue-500 self-stretch flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
          {event.title}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{event.location}</p>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3 text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {start.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            {" ~ "}
            {end.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </li>
  );
}
