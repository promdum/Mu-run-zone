import { FACULTIES } from "./faculties";
import type { FacultyStanding, RankId, RunEntry, RunnerStanding, TeamStanding } from "./types";

export const RANKS: {
  id: RankId;
  nameTh: string;
  nameEn: string;
  minKm: number;
  maxKm: number | null;
  color: string;
  glow: string;
  motto: string;
}[] = [
  {
    id: "bronze",
    nameTh: "บรอนซ์",
    nameEn: "Bronze",
    minKm: 0,
    maxKm: 100,
    color: "#c47a3a",
    glow: "rgba(196,122,58,0.35)",
    motto: "เริ่มต้นก้าวแรก",
  },
  {
    id: "silver",
    nameTh: "เงิน",
    nameEn: "Silver",
    minKm: 101,
    maxKm: 300,
    color: "#c5d0e0",
    glow: "rgba(197,208,224,0.4)",
    motto: "วิ่งสม่ำเสมอ",
  },
  {
    id: "gold",
    nameTh: "ทอง",
    nameEn: "Gold",
    minKm: 301,
    maxKm: 500,
    color: "#f5c542",
    glow: "rgba(245,197,66,0.45)",
    motto: "คณะพลังทอง",
  },
  {
    id: "platinum",
    nameTh: "แพลตินัม",
    nameEn: "Platinum",
    minKm: 501,
    maxKm: 800,
    color: "#7fd3e8",
    glow: "rgba(127,211,232,0.4)",
    motto: "ระดับแชมป์วิทยาเขต",
  },
  {
    id: "diamond",
    nameTh: "เพชร",
    nameEn: "Diamond",
    minKm: 801,
    maxKm: 1200,
    color: "#7ec8ff",
    glow: "rgba(126,200,255,0.45)",
    motto: "เจียระไนด้วยระยะทาง",
  },
  {
    id: "elite",
    nameTh: "อีลิต",
    nameEn: "Elite",
    minKm: 1201,
    maxKm: 2500,
    color: "#c4b5fd",
    glow: "rgba(196,181,253,0.5)",
    motto: "สุดยอดนักวิ่งมหาลัย",
  },
  {
    id: "legend",
    nameTh: "ตำนาน",
    nameEn: "Legend",
    minKm: 2501,
    maxKm: null,
    color: "#ffe08a",
    glow: "rgba(255,224,138,0.55)",
    motto: "ตำนานศาลายา",
  },
];

export function rankFromKm(totalKm: number) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (totalKm >= rank.minKm) current = rank;
  }
  const index = RANKS.findIndex((r) => r.id === current.id);
  const next = RANKS[index + 1] ?? null;
  const span = next ? next.minKm - current.minKm : 1;
  const progress = next
    ? Math.min(100, ((totalKm - current.minKm) / span) * 100)
    : 100;
  const kmToNext = next ? Math.max(0, next.minKm - totalKm) : 0;
  return { current, next, progress, kmToNext };
}

function toFacultyStanding(
  faculty: string,
  value: { totalKm: number; totalRuns: number; runners: Set<string> },
): FacultyStanding {
  const ranked = rankFromKm(value.totalKm);
  return {
    faculty,
    totalKm: value.totalKm,
    totalRuns: value.totalRuns,
    runners: value.runners.size,
    rank: ranked.current.id,
    nextRank: ranked.next?.id ?? null,
    kmToNext: ranked.kmToNext,
    progress: ranked.progress,
  };
}

export function facultyStandings(runs: RunEntry[]): FacultyStanding[] {
  const map = new Map<
    string,
    { totalKm: number; totalRuns: number; runners: Set<string> }
  >();

  for (const faculty of FACULTIES) {
    map.set(faculty, { totalKm: 0, totalRuns: 0, runners: new Set() });
  }

  for (const run of runs) {
    const current = map.get(run.faculty) ?? {
      totalKm: 0,
      totalRuns: 0,
      runners: new Set<string>(),
    };
    current.totalKm += run.distanceKm;
    current.totalRuns += 1;
    current.runners.add(run.name.trim());
    map.set(run.faculty, current);
  }

  return [...map.entries()]
    .map(([faculty, value]) => toFacultyStanding(faculty, value))
    .sort((a, b) => b.totalKm - a.totalKm || a.faculty.localeCompare(b.faculty, "th"));
}

export function runnerStandings(runs: RunEntry[]): RunnerStanding[] {
  const map = new Map<string, RunnerStanding>();

  for (const run of runs) {
    const key = `${run.name.trim()}::${run.faculty}`;
    const current = map.get(key);
    if (!current) {
      map.set(key, {
        name: run.name.trim(),
        faculty: run.faculty,
        team: run.team,
        totalKm: run.distanceKm,
        totalRuns: 1,
        calories: run.calories,
        bestPaceSec: run.paceSecPerKm,
        lastRunAt: run.createdAt,
      });
      continue;
    }
    current.totalKm += run.distanceKm;
    current.totalRuns += 1;
    current.calories += run.calories;
    if (run.team) current.team = run.team;
    if (run.paceSecPerKm && (!current.bestPaceSec || run.paceSecPerKm < current.bestPaceSec)) {
      current.bestPaceSec = run.paceSecPerKm;
    }
    if (new Date(run.createdAt).getTime() > new Date(current.lastRunAt).getTime()) {
      current.lastRunAt = run.createdAt;
    }
  }

  return [...map.values()].sort(
    (a, b) => b.totalKm - a.totalKm || a.name.localeCompare(b.name, "th"),
  );
}

export function teamStandings(runs: RunEntry[]): TeamStanding[] {
  const map = new Map<
    string,
    { team: string; faculty: string; totalKm: number; totalRuns: number; runners: Set<string> }
  >();

  for (const run of runs) {
    const team = run.team?.trim();
    if (!team) continue;
    const key = `${team}::${run.faculty}`;
    const current = map.get(key) ?? {
      team,
      faculty: run.faculty,
      totalKm: 0,
      totalRuns: 0,
      runners: new Set<string>(),
    };
    current.totalKm += run.distanceKm;
    current.totalRuns += 1;
    current.runners.add(run.name.trim());
    map.set(key, current);
  }

  return [...map.values()]
    .map((value) => ({
      team: value.team,
      faculty: value.faculty,
      totalKm: value.totalKm,
      totalRuns: value.totalRuns,
      runners: value.runners.size,
    }))
    .sort((a, b) => b.totalKm - a.totalKm);
}

export function getRank(id: RankId) {
  return RANKS.find((r) => r.id === id) ?? RANKS[0];
}

export function rankBand(id: RankId) {
  const rank = getRank(id);
  const min = String(rank.minKm).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (rank.maxKm === null) return `${min}+ กม.`;
  const max = String(rank.maxKm).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${min}–${max} กม.`;
}
