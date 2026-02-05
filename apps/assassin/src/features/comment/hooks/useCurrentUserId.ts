import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@libs/supabase/client";

export const useCurrentUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  return userId;
};
