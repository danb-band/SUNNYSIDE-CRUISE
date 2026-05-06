import SongService from "@features/song/service";
import SongLikeRepository from "./repository";
import { songLikeSchema } from "./schema";

const getUserLikeIdForSong = async (songId: string, userId: string): Promise<string | null> => {
  const orgId = await SongService.assertSongAccess(songId, userId);

  const like = await SongLikeRepository.getLikeBySongAndUser(songId, userId, orgId);

  if (!like) {
    return null;
  }

  const parsed = songLikeSchema.safeParse(like);

  if (!parsed.success) {
    console.error("Invalid like data from DB:", parsed.error);
    return null;
  }

  return parsed.data.id;
};

const toggleLike = async (
  songId: string,
  userId: string,
): Promise<{ likeId: string | null; orgId: string }> => {
  const orgId = await SongService.assertSongAccess(songId, userId);

  const existing = await SongLikeRepository.getLikeBySongAndUser(songId, userId, orgId);

  if (existing) {
    await SongLikeRepository.deleteLike(songId, userId, orgId);
    return { likeId: null, orgId };
  }

  const created = await SongLikeRepository.createLike(songId, userId, orgId);

  const parsed = songLikeSchema.safeParse(created);

  if (!parsed.success) {
    console.error("Invalid like data from DB:", parsed.error);
    throw new Error("Failed to create like");
  }

  return { likeId: parsed.data.id, orgId };
};

const SongLikeService = {
  getUserLikeIdForSong,
  toggleLike,
};

export default SongLikeService;
