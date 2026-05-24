import { updateTag } from "next/cache";

export const ORG_MEMBERS_CACHE_TAG = "org-members";

export const revalidateOrgMembers = (orgId: string) => {
  updateTag(`${ORG_MEMBERS_CACHE_TAG}-${orgId}`);
};
