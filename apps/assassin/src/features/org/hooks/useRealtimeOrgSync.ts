import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";

export const useRealtimeOrgSync = (orgId?: string) => {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const channelName = orgId ? `realtime:org:${orgId}` : "realtime:org";
    const config = orgId
      ? { event: "*" as const, schema: "public", table: "org", filter: `id=eq.${orgId}` }
      : { event: "*" as const, schema: "public", table: "org" };

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", config, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase, orgId]);
};
