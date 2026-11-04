import { RunfeedPageClient } from "@/components/RunfeedPageClient";
import { liveRequest } from "@/lib/http";
import type { Metadata } from "next";
import { Suspense } from "react";

export const instant = false;

export const metadata: Metadata = {
  title: "Runfeed",
};

export default async function RunfeedPage() {
  await liveRequest();
  return (
    <Suspense fallback={<p className="text-white/60">กำลังโหลด Runfeed...</p>}>
      <RunfeedPageClient />
    </Suspense>
  );
}
