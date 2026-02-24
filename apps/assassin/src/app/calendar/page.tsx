import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { CalendarPageSkeleton } from "@/components/calendar/CalendarPageSkeleton";
import { getCalendarEventsByMonthAction } from "@features/calendar/actions";
import { calendarEventKeys } from "@features/calendar/queries/keys";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { CALENDAR_CACHE_TAG } from "@libs/cache/calendar";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface CalendarPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getCachedCalendarEvents(year: number, month: number) {
  "use cache";
  cacheTag(CALENDAR_CACHE_TAG);
  cacheLife("max");
  return getCalendarEventsByMonthAction(year, month);
}

// 데이터를 패칭하고 클라이언트 컴포넌트에 공급하는 서버 컴포넌트
async function CalendarDataFetch({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const dateParam = typeof params.date === "string" ? params.date : undefined;

  const targetDate = dateParam ? new Date(dateParam) : new Date();
  if (isNaN(targetDate.getTime())) {
    targetDate.setTime(new Date().getTime());
  }

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: calendarEventKeys.lists(year, month),
    queryFn: () => getCachedCalendarEvents(year, month),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarPageClient />
    </HydrationBoundary>
  );
}

/**
 * Next.js 15 Suspense 최적화 구조:
 * 최상단 CalendarPage 컴포넌트 내부에서 곧바로 `await searchParams`나 DB 조회를 실행하면
 * 데이터를 모두 불러올 때까지 화면 전체가 렌더링되지 않고 흰 화면(블로킹)으로 멈춰있게 됩니다.
 *
 * 이를 방지하기 위해 로딩이 오래 걸리는 비동기 작업(await)을 하위의 `<CalendarDataFetch>`로 분리하고,
 * 최상단은 즉시 렌더링하여 `<Suspense>`의 fallback(스켈레톤 UI)을 먼저 브라우저에 보여주도록 설계했습니다.
 */
export default async function CalendarPage(props: CalendarPageProps) {
  return (
    <Suspense fallback={<CalendarPageSkeleton />}>
      <CalendarDataFetch searchParams={props.searchParams} />
    </Suspense>
  );
}
