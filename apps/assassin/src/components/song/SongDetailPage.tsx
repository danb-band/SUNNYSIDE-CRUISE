"use client";

import { useRouter } from "next/navigation";
import { SongDetailModal } from "./SongDetailModal";
import type { Song } from "@features/song/schema";
import type { Player } from "@/features/player/schema";

export function SongDetailPage({
  song,
  initialPlayers,
}: {
  song: Song;
  initialPlayers?: Player[];
}) {
  const router = useRouter();

  return (
    <SongDetailModal
      song={song}
      open={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) router.push("/");
      }}
      initialPlayers={initialPlayers}
    />
  );
}
