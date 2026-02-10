"use client";

import { useRouter } from "next/navigation";
import { SongDetailModal } from "./SongDetailModal";

export function SongDetailPage({ songId }: { songId: string }) {
  const router = useRouter();

  return (
    <SongDetailModal
      songId={songId}
      open={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) router.push("/");
      }}
    />
  );
}
