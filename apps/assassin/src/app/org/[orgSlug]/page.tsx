import { redirect } from "next/navigation";

interface OrgHomeProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgHomePage({ params }: OrgHomeProps) {
  const { orgSlug } = await params;
  redirect(`/org/${orgSlug}/season`);
}
