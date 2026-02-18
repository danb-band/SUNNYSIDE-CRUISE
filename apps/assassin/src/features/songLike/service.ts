import SongLikeRepository from "./repository";
import { songLikeSchema } from "./schema";

const getUserLikeForSong = async (songId: string, userId: string): Promise<boolean> => {
  const like = await SongLikeRepository.getLikeBySongAndUser(songId, userId);

  const parsed = songLikeSchema.parse(like);

  if (!parsed) {
    return false;
  }

  return true;
};

const toggleLike = async (songId: string, userId: string): Promise<{ liked: boolean }> => {
  const existing = await SongLikeRepository.getLikeBySongAndUser(songId, userId);

  if (existing) {
    await SongLikeRepository.deleteLike(songId, userId);
    return { liked: false };
  }

  const created = await SongLikeRepository.createLike(songId, userId);

  const parsed = songLikeSchema.parse(created);

  if (!parsed) {
    throw new Error("Failed to create like");
  }

  return { liked: true };
};

const SongLikeService = {
  getUserLikeForSong,
  toggleLike,
};

export default SongLikeService;
