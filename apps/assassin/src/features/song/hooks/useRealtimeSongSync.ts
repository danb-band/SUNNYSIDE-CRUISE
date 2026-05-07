import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { songKeys } from "@features/song/queries/keys";
import { eventSongKeys } from "@features/eventSong/queries/keys";
import { seasonKeys } from "@features/season/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";
import type { Season } from "@features/season/schema";

type RealtimeRow = { seasonId?: string; season_id?: string };

const getPayloadSeasonId = (payload: { new: unknown; old: unknown }): string | null => {
  const next = payload.new as RealtimeRow | null;
  const prev = payload.old as RealtimeRow | null;
  return next?.seasonId ?? next?.season_id ?? prev?.seasonId ?? prev?.season_id ?? null;
};

const hasSeasonId = (value: unknown): value is { id: string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string"
  );
};

export const useRealtimeSongSync = () => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const songsChannel = supabase
      .channel(`realtime:song:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song" }, (payload) => {
        const seasonId = getPayloadSeasonId(payload);
        if (!seasonId) return;

        const seasonQueryData = queryClient.getQueriesData<Season | Season[]>({
          queryKey: seasonKeys.org(orgId),
        });

        let hasScopedSeasonCache = false;
        let belongsToCurrentOrg = false;

        for (const [, data] of seasonQueryData) {
          if (Array.isArray(data)) {
            if (data.length > 0) hasScopedSeasonCache = true;
            if (data.some((season) => hasSeasonId(season) && season.id === seasonId)) {
              belongsToCurrentOrg = true;
              break;
            }
            continue;
          }

          if (hasSeasonId(data)) {
            hasScopedSeasonCache = true;
            if (data.id === seasonId) {
              belongsToCurrentOrg = true;
              break;
            }
          }
        }

        if (hasScopedSeasonCache && !belongsToCurrentOrg) {
          return;
        }

        queryClient.invalidateQueries({ queryKey: songKeys.byOrg(orgId) });
        queryClient.invalidateQueries({ queryKey: songKeys.bySeason(orgId, seasonId) });
        queryClient.invalidateQueries({ queryKey: eventSongKeys.org(orgId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(songsChannel);
    };
  }, [orgId, queryClient, supabase]);
};
