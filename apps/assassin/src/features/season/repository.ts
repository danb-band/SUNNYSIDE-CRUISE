import { prisma } from "@libs/prisma/client";
import type { Season } from "@generated/prisma/client";
import { SeasonPayload, SeasonUpdatePayload } from "./schema";
import { TransactionClient } from "@libs/prisma/types";

async function getAllSeasons(orgId: string): Promise<Season[]> {
  const seasons = await prisma.season.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });
  return seasons;
}

async function getSeasonById(id: string, orgId: string): Promise<Season | null> {
  const season = await prisma.season.findFirst({
    where: { id, orgId },
  });
  return season;
}

async function createSeason(input: SeasonPayload, orgId: string): Promise<Season> {
  const season = await prisma.season.create({
    data: {
      name: input.name,
      sortOrder: input.sortOrder,
      isArchived: input.isArchived,
      orgId,
    },
  });
  return season;
}

async function updateSeason(
  id: string,
  orgId: string,
  input: SeasonUpdatePayload,
): Promise<Season> {
  const existing = await prisma.season.findFirst({ where: { id, orgId } });
  if (!existing) throw new Error("Season not found in org");

  return prisma.season.update({
    where: { id },
    data: {
      name: input.name,
      sortOrder: input.sortOrder,
      isArchived: input.isArchived,
    },
  });
}

async function hardDeleteSeason(id: string, orgId: string, tx?: TransactionClient): Promise<void> {
  const prismaClient = tx || prisma;
  await prismaClient.season.deleteMany({
    where: { id, orgId },
  });
}

async function hardDeleteSeasonsByOrgId(orgId: string, tx?: TransactionClient): Promise<void> {
  const prismaClient = tx || prisma;
  await prismaClient.season.deleteMany({
    where: { orgId },
  });
}

const SeasonRepository = {
  getAllSeasons,
  getSeasonById,
  createSeason,
  updateSeason,
  hardDeleteSeason,
  hardDeleteSeasonsByOrgId,
};

export default SeasonRepository;
