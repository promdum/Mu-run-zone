import { FacultyDetail } from "@/components/FacultyDetail";
import { FACULTIES, facultyFromSlug, slugFromFaculty } from "@/lib/faculties";
import type { Metadata } from "next";

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

export default async function FacultyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <FacultyDetail slug={slug} />;
}
