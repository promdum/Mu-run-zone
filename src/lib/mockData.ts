import type { RunEntry } from "@/lib/types";

/** Presentation week. The public boards read this set instead of the live database. */
export const DEMO_MODE = true;

export const SHED128_DAILY_CAP_KM = 200;

export interface FacultyRank {
  rank: number;
  faculty: string;
  totalDistance: number;
  cappedDistance: number;
  runnerCount: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "ELITE" | "LEGEND";
  tierLabel: string;
}

export const mockFacultyLeaderboard: FacultyRank[] = [
  {
    rank: 1,
    faculty: "วิทยาลัยวิทยาศาสตร์และเทคโนโลยีการกีฬา",
    totalDistance: 285,
    cappedDistance: 280,
    runnerCount: 22,
    tier: "SILVER",
    tierLabel: "วิ่งสม่ำเสมอ",
  },
  {
    rank: 2,
    faculty: "คณะวิศวกรรมศาสตร์",
    totalDistance: 260,
    cappedDistance: 245,
    runnerCount: 14,
    tier: "SILVER",
    tierLabel: "วิ่งสม่ำเสมอ",
  },
  {
    rank: 3,
    faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    totalDistance: 180,
    cappedDistance: 175,
    runnerCount: 8,
    tier: "SILVER",
    tierLabel: "วิ่งสม่ำเสมอ",
  },
  {
    rank: 4,
    faculty: "คณะกายภาพบำบัด",
    totalDistance: 95,
    cappedDistance: 95,
    runnerCount: 5,
    tier: "BRONZE",
    tierLabel: "เริ่มต้นก้าวแรก",
  },
  {
    rank: 5,
    faculty: "คณะพยาบาลศาสตร์",
    totalDistance: 60,
    cappedDistance: 60,
    runnerCount: 3,
    tier: "BRONZE",
    tierLabel: "เริ่มต้นก้าวแรก",
  },
];

const ROSTERS: Record<string, string[]> = {
  วิทยาลัยวิทยาศาสตร์และเทคโนโลยีการกีฬา: [
    "ธนพล ศรีสุข",
    "กานต์ชนก ใจเย็น",
    "พีรพัฒน์ วงศ์ไทย",
    "ชญานิศ แสงทอง",
    "ภูมิพัฒน์ ตั้งตรง",
    "ณัฐชา อินทร์แก้ว",
    "สิรภพ บุญมา",
    "ปิยธิดา มั่นคง",
    "อชิระ พงษ์พิพัฒน์",
    "วรินทร ชาญชัย",
    "ธัญพิมล รุ่งเรือง",
    "กันตพงศ์ เลิศนภา",
    "มินตรา สุขสำราญ",
    "ภาคิน ทองดี",
    "ณิชาภัทร พูลผล",
    "ศุภกร เจริญผล",
    "อรรถพล นาคินทร์",
    "พิชญา วัฒนกุล",
    "รชต สายชล",
    "ญาณิน โชคดี",
    "ธีรภัทร แก้วมณี",
    "ลลิตา พรมมา",
  ],
  คณะวิศวกรรมศาสตร์: [
    "หฤษฎ์ พานิช",
    "นภัสสร จิตต์แจ่ม",
    "ปุณณภพ รัตนโกสินทร์",
    "ชลธิชา เมฆลอย",
    "วสุธร กิตติคุณ",
    "พิมพ์ชนก อุไร",
    "ศิริชัย บุญส่ง",
    "กฤตภาส ตั้งมั่น",
    "อภิชญา ศรีลา",
    "ณัฐวุฒิ เพชรรัตน์",
    "ปาณิสรา ทองใบ",
    "ธนวัฒน์ คงคา",
    "มิรา วงศ์สุวรรณ",
    "ภูริช แสงเดือน",
  ],
  คณะเทคโนโลยีสารสนเทศและการสื่อสาร: [
    "เจษฎา อัครเดช",
    "สรัลชนา พิทักษ์",
    "ณัฐริกา สายไหม",
    "ปัณณวัฒน์ ดวงดี",
    "เกวลิน ใจซื่อ",
    "ธนกร สมบูรณ์",
    "พิมพ์มาดา รุ่งโรจน์",
    "คเชนทร์ ธรรมรักษ์",
  ],
  คณะกายภาพบำบัด: ["ศศิวิมล รักษ์ดี", "อานนท์ แข็งแรง", "ขวัญชนก พยุงใจ", "ปฏิภาณ กายสิทธิ์", "เมธาวี สุขสันต์"],
  คณะพยาบาลศาสตร์: ["พรทิพย์ ดวงแก้ว", "ณภัทร สุขใจ", "อริสา มณีรัตน์"],
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function allocateKm(total: number, count: number, seed: number) {
  const weights = Array.from({ length: count }, (_, index) => 8 + ((seed + index * 5) % 9));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const shares = weights.map((weight) => Math.floor(((total * weight) / weightSum) * 10) / 10);
  let drift = round1(total - shares.reduce((sum, km) => sum + km, 0));
  let cursor = 0;
  while (Math.abs(drift) >= 0.1 && cursor < count * 20) {
    const index = cursor % count;
    const step = Math.sign(drift) * 0.1;
    const next = round1(shares[index] + step);
    if (next >= 4) {
      shares[index] = next;
      drift = round1(drift - step);
    }
    cursor += 1;
  }
  return shares;
}

function chunks(km: number) {
  if (km <= 8.5) return [round1(km)];
  const count = km > 16 ? 3 : 2;
  const parts: number[] = [];
  let left = km;
  for (let index = 0; index < count - 1; index += 1) {
    const part = Math.max(3, round1(left / (count - index)));
    parts.push(part);
    left = round1(left - part);
  }
  parts.push(round1(left));
  return parts.filter((part) => part > 0);
}

function ranAt(personIndex: number, runIndex: number) {
  const day = (personIndex * 3 + runIndex * 2) % 7;
  const hour = 6 + ((personIndex + runIndex * 3) % 13);
  const minute = (personIndex * 7 + runIndex * 11) % 60;
  return new Date(Date.UTC(2026, 9, 29 + day, hour - 7, minute, 0)).toISOString();
}

function buildRuns(): RunEntry[] {
  const runs: RunEntry[] = [];
  let personIndex = 0;
  for (const faculty of mockFacultyLeaderboard) {
    const names = ROSTERS[faculty.faculty];
    const shares = allocateKm(faculty.totalDistance, names.length, faculty.rank * 11);
    names.forEach((name, rosterIndex) => {
      const parts = chunks(shares[rosterIndex]);
      parts.forEach((distanceKm, runIndex) => {
        const paceSecPerKm = 310 + ((personIndex * 13 + runIndex * 17) % 130);
        const when = ranAt(personIndex, runIndex);
        runs.push({
          id: `demo-${faculty.rank}-${rosterIndex + 1}-${runIndex + 1}`,
          userId: `demo-runner-${faculty.rank}-${rosterIndex + 1}`,
          name,
          faculty: faculty.faculty,
          distanceKm,
          durationSec: Math.round(paceSecPerKm * distanceKm),
          paceSecPerKm,
          calories: Math.round(distanceKm * 62),
          createdAt: when,
          ranAt: when,
          status: "verified",
          flags: [],
        });
      });
      personIndex += 1;
    });
  }
  return runs;
}

export const demoRuns: RunEntry[] = buildRuns();

export function demoCappedKm(faculty: string, totalKm: number) {
  const row = mockFacultyLeaderboard.find((item) => item.faculty === faculty);
  if (!row || Math.abs(round1(totalKm) - row.totalDistance) > 0.05) return round1(totalKm);
  return row.cappedDistance;
}
