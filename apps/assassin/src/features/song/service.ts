import SongRepository from "./lib/song.repository";
import { songSchema } from "./schemas/song";

const assertSongExists = async (songId: string): Promise<void> => {
  const song = await SongRepository.getSongById(songId);

  const parsed = songSchema.safeParse(song);

  if (!parsed.success) {
    throw new Error(`Song with ID ${songId} does not exist.`);
  }
};

const SongService = { assertSongExists };

export default SongService;
