"use client";

import { Song } from "@features/song/schema";
import { SongItem } from "./SongItem";

interface SongPreviewProps {
  song: Song;
}

export function SongPreview({ song }: SongPreviewProps) {
  return <SongItem song={song} />;
}
