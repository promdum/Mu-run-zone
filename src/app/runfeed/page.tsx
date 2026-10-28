import { RunfeedPageClient } from "@/components/RunfeedPageClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Runfeed",
};

export default function RunfeedPage() {
  return (
    <Suspense fallback={<p className="text-white/60">กำลังโหลด Runfeed...</p>}>
      <RunfeedPageClient />
    </Suspense>
  );
}
