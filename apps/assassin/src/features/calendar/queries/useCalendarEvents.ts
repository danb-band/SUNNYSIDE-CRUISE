import { useSuspenseQuery } from "@tanstack/react-query";
import { getCalendarEventsByMonthAction } from "../actions";
import { calendarEventKeys } from "./keys";
import type { CalendarEvent } from "../schema";
import { useOrgId } from "@libs/org/OrgProvider";

export const useCalendarEvents = (year: number, month: number) => {
  const orgId = useOrgId();
  return useSuspenseQuery({
    queryKey: calendarEventKeys.lists(orgId, year, month),
    queryFn: () => getCalendarEventsByMonthAction(year, month, orgId),
    select: (data: CalendarEvent[]) =>
      [...data].sort((a, b) => {
        const timeDiff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        if (timeDiff !== 0) return timeDiff;
        // 설정한 시간이 같으면 생성순(createdAt)으로 정렬
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }),
  });
};
