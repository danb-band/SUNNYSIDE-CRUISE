"use client";

import { useParams, useRouter } from "next/navigation";
import { SongDetailModal } from "./SongDetailModal";

export function SongDetailPage({ songId }: { songId: string }) {
  const router = useRouter();
  const params = useParams<{ orgSlug?: string }>();

  return (
    <SongDetailModal
      songId={songId}
      open={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          router.push(params.orgSlug ? `/org/${params.orgSlug}/season` : "/");
        }
      }}
    />
  );
}
