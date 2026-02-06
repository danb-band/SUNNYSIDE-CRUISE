import SongService from "@features/song/service";
import PlayerService from "@features/player/service";
import { SongModalRoute } from "@/components/song/SongModalRoute";

interface Props {
  params: Promise<{ songId: string }>;
}

export default async function SongModalPage({ params }: Props) {
  const { songId } = await params;
  const [song, players] = await Promise.all([
    SongService.getSongById(songId),
    PlayerService.getPlayersBySongId(songId),
  ]);

  return <SongModalRoute song={song} initialPlayers={players} />;
}
