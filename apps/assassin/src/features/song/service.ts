const assertSongExists = async (songId: string): Promise<void> => {
  // const song = await songApi.getById(songId);
  const song = null; // TODO: replace with songApi.getById(songId)

  if (!song) {
    throw new Error(`Song with ID ${songId} does not exist.`);
  }
};

const SongService = { assertSongExists };

export default SongService;
