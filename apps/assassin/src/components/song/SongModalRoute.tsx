"use client";

import { useRouter } from "next/navigation";
import { SongDetailModal } from "./SongDetailModal";
import type { Song } from "@features/song/schema";

export function SongModalRoute({ song }: { song: Song }) {
  const router = useRouter();

  return (
    <SongDetailModal
      song={song}
      open={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) router.back();
      }}
    />
  );
}
