import type { Metadata } from "next";
import ProfileView from "@/components/profile/ProfileView";
import { PageHeader } from "@/components/ui/States";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader step="Identity" title="Your signal." sub="Your mood history, your account, and how the universe renders for you." />
      <ProfileView />
    </>
  );
}
