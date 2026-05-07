import { prisma } from "@libs/prisma/client";
import type { Profile } from "@generated/prisma/client";
import { UpdateProfilePayload } from "./schema";

async function getProfileById(id: string): Promise<Profile | null> {
  return await prisma.profile.findUnique({
    where: { id },
  });
}

async function getProfilesByOrg(orgId: string): Promise<Profile[]> {
  return await prisma.profile.findMany({
    where: {
      orgMembers: {
        some: { orgId },
      },
    },
    orderBy: { realName: "asc" },
  });
}

async function updateProfile(input: UpdateProfilePayload): Promise<Profile> {
  return await prisma.profile.update({
    where: { id: input.userId },
    data: { name: input.name },
  });
}

const UserRepository = {
  getProfileById,
  getProfilesByOrg,
  updateProfile,
};

export default UserRepository;
