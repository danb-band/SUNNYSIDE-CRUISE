import SongService from "@features/song/service";
import { SongModalRoute } from "@/components/song/SongModalRoute";

interface Props {
  params: Promise<{ songId: string }>;
}

export default async function SongModalPage({ params }: Props) {
  const { songId } = await params;
  const song = await SongService.getSongById(songId);

  return <SongModalRoute song={song} />;
}
