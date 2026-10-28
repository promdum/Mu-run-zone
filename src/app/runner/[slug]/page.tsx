import { RunnerProfile } from "@/components/RunnerProfile";
import { decodeRunnerSlug } from "@/lib/faculties";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const identity = decodeRunnerSlug(slug);
  return { title: identity?.name ?? "นักวิ่ง" };
}

export default async function RunnerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RunnerProfile slug={slug} />;
}
