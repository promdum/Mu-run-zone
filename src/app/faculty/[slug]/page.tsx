import { FacultyDetail } from "@/components/FacultyDetail";
import { FACULTIES, facultyFromSlug, slugFromFaculty } from "@/lib/faculties";
import type { Metadata } from "next";
import { Suspense } from "react";

export function generateStaticParams() {
  return FACULTIES.map((faculty) => ({ slug: slugFromFaculty(faculty) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const faculty = facultyFromSlug(slug);
  return { title: faculty ?? "คณะ" };
}

async function FacultyContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FacultyDetail slug={slug} />;
}

export default function FacultyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-white/60">กำลังโหลดข้อมูลคณะ...</p>}>
      <FacultyContent params={params} />
    </Suspense>
  );
}
