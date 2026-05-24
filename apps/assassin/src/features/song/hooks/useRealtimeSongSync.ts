import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { songKeys } from "@features/song/queries/keys";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { useOrgId } from "@/components/org/OrgProvider";

type SongRow = {
  id?: string;
  seasonId?: string;
  season_id?: string;
};

const getSongId = (row: SongRow | undefined | null): string | null => {
  const songId = row?.id ?? null;
  return typeof songId === "string" ? songId : null;
};

const getSeasonId = (row: SongRow | undefined | null): string | null => {
  const seasonId = row?.seasonId ?? row?.season_id ?? null;
  return typeof seasonId === "string" ? seasonId : null;
};

export const useRealtimeSongSync = (songId: string) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:song:detail:${orgId}:${songId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song" }, (payload) => {
        const nextRow = payload.new as SongRow | undefined;
        const prevRow = payload.old as SongRow | undefined;
        const affectedSongId = getSongId(nextRow) ?? getSongId(prevRow);

        if (affectedSongId && affectedSongId !== songId) return;
        queryClient.invalidateQueries({ queryKey: songKeys.detail(orgId, songId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient, songId, supabase]);
};

export const useRealtimeSongsBySeasonSync = (seasonIds: string[]) => {
  const queryClient = useQueryClient();
  const orgId = useOrgId();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    if (seasonIds.length === 0) return;

    const channel = supabase
      .channel(`realtime:song:season:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song" }, (payload) => {
        const nextRow = payload.new as SongRow | undefined;
        const prevRow = payload.old as SongRow | undefined;
        const nextSeasonId = getSeasonId(nextRow);
        const prevSeasonId = getSeasonId(prevRow);

        if (
          nextSeasonId !== null &&
          prevSeasonId !== null &&
          !seasonIds.includes(nextSeasonId) &&
          !seasonIds.includes(prevSeasonId)
        ) {
          return;
        }

        if (nextSeasonId === null && prevSeasonId === null) {
          seasonIds.forEach((seasonId) => {
            queryClient.invalidateQueries({ queryKey: songKeys.bySeason(orgId, seasonId) });
          });
          return;
        }

        seasonIds.forEach((seasonId) => {
          if (seasonId === nextSeasonId || seasonId === prevSeasonId) {
            queryClient.invalidateQueries({ queryKey: songKeys.bySeason(orgId, seasonId) });
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient, seasonIds, supabase]);
};
