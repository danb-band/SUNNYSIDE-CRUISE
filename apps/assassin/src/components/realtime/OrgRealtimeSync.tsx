"use client";

import { useRealtimeSongSync } from "@/features/song/hooks/useRealtimeSongSync";

export function OrgRealtimeSync() {
  useRealtimeSongSync();
  return null;
}
