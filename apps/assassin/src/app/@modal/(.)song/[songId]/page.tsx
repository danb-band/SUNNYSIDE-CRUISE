import SongService from "@features/song/service";
import PlayerService from "@features/player/service";
import { SongModalRoute } from "@/components/song/SongModalRoute";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ songId: string }>;
}

export default async function SongModalPage({ params }: Props) {
  const { songId } = await params;
  const [song, players] = await Promise.all([
    SongService.getSongById(songId),
    PlayerService.getPlayersBySongId(songId),
  ]);

  if (!song) {
    notFound();
  }

  return <SongModalRoute song={song} initialPlayers={players} />;
}
