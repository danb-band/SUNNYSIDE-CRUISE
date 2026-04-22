import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Season } from "@features/season/schema";
import { seasonKeys } from "@features/season/queries/keys";
import { songKeys } from "@features/song/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

export const useRealtimeSeasonSync = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const seasonsChannel = supabase
      .channel("realtime:season")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "season", filter: `orgId=eq.${orgId}` },
        (payload) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE" | undefined;

          if (eventType === "DELETE") {
            const deletedId = (payload.old as Season | undefined)?.id;
            if (!deletedId) return;
            queryClient.setQueryData(seasonKeys.lists(orgId), (prev: Season[] | undefined) =>
              prev ? prev.filter((season) => season.id !== deletedId) : prev,
            );
            queryClient.removeQueries({ queryKey: seasonKeys.detail(orgId, deletedId) });
            queryClient.removeQueries({ queryKey: songKeys.bySeason(orgId, deletedId) });
            return;
          }

          const nextSeason = payload.new as Season | undefined;
          if (!nextSeason) return;

          if (eventType === "INSERT") {
            queryClient.setQueryData(seasonKeys.lists(orgId), (prev: Season[] | undefined) =>
              prev ? [...prev, nextSeason] : [nextSeason],
            );
            queryClient.setQueryData(seasonKeys.detail(orgId, nextSeason.id), nextSeason);
            return;
          }

          // UPDATE
          queryClient.setQueryData(seasonKeys.lists(orgId), (prev: Season[] | undefined) => {
            if (!prev) return prev;
            return prev.map((season) =>
              season.id === nextSeason.id ? { ...season, ...nextSeason } : season,
            );
          });
          queryClient.setQueryData(seasonKeys.detail(orgId, nextSeason.id), nextSeason);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(seasonsChannel);
    };
  }, [orgId, queryClient, supabase]);
};
