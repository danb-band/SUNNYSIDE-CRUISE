"use client";

import { TabNav } from "@/components/common/TabNav";
import { LogoutButton } from "@/components/common/LogoutButton";
import { useCalendarEvents } from "@/features/calendar/queries/useCalendarEvents";

export function CalendarPageClient() {
  const { data: events } = useCalendarEvents();

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-0">
          <TabNav />
          <div className="mb-4 sm:mb-6 flex items-center justify-end flex-shrink-0">
            <LogoutButton />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-slate-400 text-sm">일정이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="p-3 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-slate-500">{event.location}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(event.startDate).toLocaleDateString("ko-KR")} ~{" "}
                      {new Date(event.endDate).toLocaleDateString("ko-KR")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
