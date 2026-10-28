export const FACULTIES = [
  "คณะวิทยาศาสตร์",
  "คณะวิศวกรรมศาสตร์",
  "คณะศิลปศาสตร์",
  "คณะสังคมศาสตร์และมนุษยศาสตร์",
  "คณะสิ่งแวดล้อมและทรัพยากรศาสตร์",
  "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
  "วิทยาลัยนานาชาติ (MUIC)",
  "วิทยาลัยวิทยาศาสตร์และเทคโนโลยีการกีฬา",
  "คณะกายภาพบำบัด",
  "คณะสัตวแพทยศาสตร์",
  "คณะสาธารณสุขศาสตร์",
  "คณะพยาบาลศาสตร์",
  "คณะเภสัชศาสตร์",
  "บัณฑิตวิทยาลัย",
  "วิทยาลัยการจัดการ",
  "วิทยาลัยดุริยางคศิลป์",
  "บุคลากรมหาวิทยาลัย",
  "ชมรม / ทีมอื่นๆ",
] as const;

export type FacultyName = (typeof FACULTIES)[number];

const SLUGS: Record<FacultyName, string> = {
  คณะวิทยาศาสตร์: "science",
  คณะวิศวกรรมศาสตร์: "engineering",
  คณะศิลปศาสตร์: "liberal-arts",
  คณะสังคมศาสตร์และมนุษยศาสตร์: "social-sciences",
  คณะสิ่งแวดล้อมและทรัพยากรศาสตร์: "environment",
  คณะเทคโนโลยีสารสนเทศและการสื่อสาร: "ict",
  "วิทยาลัยนานาชาติ (MUIC)": "muic",
  วิทยาลัยวิทยาศาสตร์และเทคโนโลยีการกีฬา: "sport-science",
  คณะกายภาพบำบัด: "physical-therapy",
  คณะสัตวแพทยศาสตร์: "veterinary",
  คณะสาธารณสุขศาสตร์: "public-health",
  คณะพยาบาลศาสตร์: "nursing",
  คณะเภสัชศาสตร์: "pharmacy",
  บัณฑิตวิทยาลัย: "graduate",
  วิทยาลัยการจัดการ: "management",
  วิทยาลัยดุริยางคศิลป์: "music",
  บุคลากรมหาวิทยาลัย: "staff",
  "ชมรม / ทีมอื่นๆ": "clubs",
};

const BY_SLUG = Object.fromEntries(
  (Object.entries(SLUGS) as [FacultyName, string][]).map(([name, slug]) => [slug, name]),
) as Record<string, FacultyName>;

export function slugFromFaculty(faculty: string) {
  return SLUGS[faculty as FacultyName] ?? "clubs";
}

export function facultyFromSlug(slug: string): FacultyName | null {
  return BY_SLUG[slug] ?? null;
}

export function runnerKey(name: string, faculty: string) {
  return `${name.trim()}::${faculty}`;
}

export function encodeRunnerSlug(name: string, faculty: string) {
  return encodeURIComponent(runnerKey(name, faculty));
}

export function decodeRunnerSlug(slug: string) {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }
  const faculty = FACULTIES.find((item) => decoded.endsWith(`::${item}`));
  if (!faculty) return null;
  const name = decoded.slice(0, decoded.length - faculty.length - 2).trim();
  if (!name) return null;
  return { name, faculty };
}
