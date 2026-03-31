import { notFound } from "next/navigation";
import { getOrgBySlugAction } from "@features/org/actions";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;
  const org = await getOrgBySlugAction(orgSlug).catch(() => null);

  if (!org) {
    notFound();
  }

  return <>{children}</>;
}
