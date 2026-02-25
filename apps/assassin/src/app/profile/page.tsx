import { Suspense } from "react";
import { Profile } from "@/components/user/Profile";
import { ProfileSkeleton } from "@/components/user/ProfileSkeleton";

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Profile />
    </Suspense>
  );
}
