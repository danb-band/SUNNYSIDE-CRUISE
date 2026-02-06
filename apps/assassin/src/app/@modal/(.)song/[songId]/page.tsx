import SongService from "@features/song/service";
import { SongModalRoute } from "@/components/song/SongModalRoute";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ songId: string }>;
}

export default async function SongModalPage({ params }: Props) {
  const { songId } = await params;
  const song = await SongService.getSongById(songId);

  if (!song) {
    notFound();
  }

  return <SongModalRoute song={song} />;
}
