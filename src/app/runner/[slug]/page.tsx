import { RunnerProfile } from "@/components/RunnerProfile";
import { decodeRunnerSlug } from "@/lib/faculties";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const identity = decodeRunnerSlug(slug);
  return { title: identity?.name ?? "นักวิ่ง" };
}

async function RunnerContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RunnerProfile slug={slug} />;
}

export default function RunnerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-white/60">กำลังโหลดโปรไฟล์นักวิ่ง...</p>}>
      <RunnerContent params={params} />
    </Suspense>
  );
}
