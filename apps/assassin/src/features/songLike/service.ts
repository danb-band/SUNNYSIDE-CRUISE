import { assertOrgMember } from "@features/org/service";
import SongLikeRepository from "./repository";
import { songLikeSchema } from "./schema";

const getUserLikeIdForSong = async (
  songId: string,
  orgId: string,
  userId: string,
): Promise<string | null> => {
  await assertOrgMember(userId, orgId);

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
  orgId: string,
  userId: string,
): Promise<{ likeId: string | null }> => {
  await assertOrgMember(userId, orgId);

  const existing = await SongLikeRepository.getLikeBySongAndUser(songId, userId, orgId);

  if (existing) {
    await SongLikeRepository.deleteLike(songId, userId, orgId);
    return { likeId: null };
  }

  const created = await SongLikeRepository.createLike(songId, userId, orgId);

  const parsed = songLikeSchema.safeParse(created);

  if (!parsed.success) {
    console.error("Invalid like data from DB:", parsed.error);
    throw new Error("Failed to create like");
  }

  return { likeId: parsed.data.id };
};

const SongLikeService = {
  getUserLikeIdForSong,
  toggleLike,
};

export default SongLikeService;
