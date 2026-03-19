import UserRepository from "./repository";
import { Profile, profileSchema, updateProfileSchema, UpdateProfilePayload } from "./schema";

const getAllProfiles = async (): Promise<Profile[]> => {
  const profiles = await UserRepository.getAllProfiles();
  const parsed = profileSchema.array().safeParse(profiles);
  if (!parsed.success) {
    throw new Error("Invalid profile responses from DB");
  }
  return parsed.data;
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

const updateProfile = async (id: string, payload: UpdateProfilePayload): Promise<Profile> => {
  const parsedInput = updateProfileSchema.safeParse(payload);

  if (!parsedInput.success) {
    throw new Error("Invalid profile input");
  }

  const profile = await UserRepository.getProfileById(id);

  if (!profile) {
    throw new Error(`Profile with ID ${id} does not exist.`);
  }

  const updated = await UserRepository.updateProfile(id, parsedInput.data);

  const parsed = profileSchema.safeParse(updated);

  if (!parsed.success) {
    throw new Error("Invalid profile response from DB");
  }

  return parsed.data;
};

const UserService = {
  getProfile,
  getAllProfiles,
  updateProfile,
};

export default UserService;
