import { ProfilePanel } from "@/components/ProfilePanel";
import { liveRequest } from "@/lib/http";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "โปรไฟล์",
};

export default async function ProfilePage() {
  await liveRequest();
  return <ProfilePanel />;
}
