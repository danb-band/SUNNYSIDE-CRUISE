import UserRepository from "./repository";
import { Profile, profileSchema, updateProfileSchema, UpdateProfilePayload } from "./schema";
import type { Profile as PrismaProfile } from "@generated/prisma/client";

const getAllProfiles = async (): Promise<PrismaProfile[]> => {
  return await UserRepository.getAllProfiles();
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
