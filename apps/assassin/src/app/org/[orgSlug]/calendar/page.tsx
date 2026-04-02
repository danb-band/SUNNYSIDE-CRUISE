import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { CalendarPageSkeleton } from "@/components/calendar/CalendarPageSkeleton";
import { getCalendarEventsByMonthAction } from "@features/calendar/actions";
import { calendarEventKeys } from "@features/calendar/queries/keys";
import type { CalendarEvent } from "@features/calendar/schema";
import { getRsvpAttendeesAction, getUserRsvpStatusAction } from "@features/rsvp/actions";
import { rsvpKeys } from "@features/rsvp/queries/keys";
import { getSongsByEventAction } from "@features/eventSong/actions";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import { getOrgBySlugAction } from "@features/org/actions";
import { getQueryClient } from "@libs/react-query/getQueryClient";
import { CALENDAR_CACHE_TAG } from "@libs/cache/calendar";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";

interface CalendarPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getCachedCalendarEvents(year: number, month: number, orgId: string) {
  "use cache";
  cacheTag(CALENDAR_CACHE_TAG);
  cacheLife("max");
  return getCalendarEventsByMonthAction(year, month, orgId);
}

async function CalendarDataFetch({ params, searchParams }: CalendarPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgBySlugAction(orgSlug).catch(() => null);
  if (!org) notFound();

  const resolvedSearchParams = await searchParams;
  const dateParam =
    typeof resolvedSearchParams.date === "string" ? resolvedSearchParams.date : undefined;

  const targetDate = dateParam ? new Date(dateParam) : new Date();
  if (isNaN(targetDate.getTime())) {
    targetDate.setTime(new Date().getTime());
  }

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: calendarEventKeys.lists(org.id, year, month),
    queryFn: () => getCachedCalendarEvents(year, month, org.id),
  });

  const events =
    queryClient.getQueryData<CalendarEvent[]>(calendarEventKeys.lists(org.id, year, month)) ?? [];
  await Promise.all(
    events.flatMap((event) => [
      queryClient.prefetchQuery({
        queryKey: rsvpKeys.byEvent(event.id),
        queryFn: () => getRsvpAttendeesAction(event.id),
      }),
      queryClient.prefetchQuery({
        queryKey: rsvpKeys.byUser(event.id),
        queryFn: () => getUserRsvpStatusAction(event.id),
      }),
      queryClient.prefetchQuery({
        queryKey: eventSongKeys.byEvent(event.id),
        queryFn: () => getSongsByEventAction(event.id),
      }),
    ]),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarPageClient />
    </HydrationBoundary>
  );
}

export default async function OrgCalendarPage(props: CalendarPageProps) {
  return (
    <Suspense fallback={<CalendarPageSkeleton />}>
      <CalendarDataFetch params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
