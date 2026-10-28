import { ProfilePanel } from "@/components/ProfilePanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "โปรไฟล์",
};

export default function ProfilePage() {
  return <ProfilePanel />;
}
