import { prisma } from "@libs/prisma/client";
import type { Profile } from "@generated/prisma/client";
import { UpdateProfilePayload } from "./schema";

async function getProfileById(id: string): Promise<Profile | null> {
  return await prisma.profile.findUnique({
    where: { id },
  });
}

async function updateProfile(id: string, input: UpdateProfilePayload): Promise<Profile> {
  return await prisma.profile.update({
    where: { id },
    data: { name: input.name },
  });
}

const UserRepository = {
  getProfileById,
  updateProfile,
};

export default UserRepository;
