import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { CalendarPageSkeleton } from "@/components/calendar/CalendarPageSkeleton";
import { getCalendarEventsAction } from "@features/calendar/actions";
import { calendarEventKeys } from "@features/calendar/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { CALENDAR_CACHE_TAG } from "@libs/cache/calendar";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function CalendarPage() {
  "use cache";
  cacheTag(CALENDAR_CACHE_TAG);
  cacheLife("max");

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: calendarEventKeys.lists(),
    queryFn: getCalendarEventsAction,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<CalendarPageSkeleton />}>
        <CalendarPageClient />
      </Suspense>
    </HydrationBoundary>
  );
}
