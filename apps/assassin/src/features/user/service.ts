import { assertOrgMember } from "@features/org/service";
import SongRepository from "@features/song/repository";
import UserRepository from "./repository";
import { Profile, profileSchema, updateProfileSchema, UpdateProfilePayload } from "./schema";

const getProfilesByOrg = async (orgId: string, requesterId: string): Promise<Profile[]> => {
  await assertOrgMember(requesterId, orgId);
  const profiles = await UserRepository.getProfilesByOrg(orgId);
  const parsed = profileSchema.array().safeParse(profiles);
  if (!parsed.success) {
    throw new Error("Invalid profile responses from DB");
  }
  return parsed.data;
};

const getProfilesBySong = async (
  songId: string,
  orgId: string,
  requesterId: string,
): Promise<Profile[]> => {
  await assertOrgMember(requesterId, orgId);

  const song = await SongRepository.getSongByIdInOrg(songId, orgId);
  if (!song) {
    throw new Error("Song not found");
  }

  return await getProfilesByOrg(orgId, requesterId);
};

const getProfile = async (id: string): Promise<Profile | null> => {
  const profile = await UserRepository.getProfileById(id);

  if (!profile) return null;

  const parsed = profileSchema.safeParse(profile);

  if (!parsed.success) {
    throw new Error("Invalid profile response from DB");
  }

  return parsed.data;
};

const updateProfile = async (
  payload: UpdateProfilePayload,
  actorUserId: string,
): Promise<Profile> => {
  const parsedInput = updateProfileSchema.safeParse(payload);

  if (!parsedInput.success) {
    throw new Error("Invalid profile input");
  }

  if (parsedInput.data.userId !== actorUserId) {
    throw new Error("Unauthorized: you can only update your own profile");
  }

  const profile = await UserRepository.getProfileById(parsedInput.data.userId);

  if (!profile) {
    throw new Error(`Profile with ID ${parsedInput.data.userId} does not exist.`);
  }

  const updated = await UserRepository.updateProfile(parsedInput.data);

  const parsed = profileSchema.safeParse(updated);

  if (!parsed.success) {
    throw new Error("Invalid profile response from DB");
  }

  return parsed.data;
};

const UserService = {
  getProfile,
  getProfilesByOrg,
  getProfilesBySong,
  updateProfile,
};

export default UserService;
