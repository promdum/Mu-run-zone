import type { RunEntry, RunStatus } from "@/lib/types";

export function toRunEntry(run: {
  id: string;
  userId: string | null;
  name: string;
  faculty: string;
  team: string | null;
  distanceKm: number;
  durationSec: number;
  paceSecPerKm: number | null;
  calories: number;
  proofImage: string | null;
  createdAt: Date;
  ranAt: Date;
  status: string;
  flags: string[];
}): RunEntry {
  const status: RunStatus = run.status === "pending" ? "pending" : "verified";
  return {
    id: run.id,
    userId: run.userId ?? undefined,
    name: run.name,
    faculty: run.faculty,
    team: run.team ?? undefined,
    distanceKm: run.distanceKm,
    durationSec: run.durationSec,
    paceSecPerKm: run.paceSecPerKm ?? undefined,
    calories: run.calories,
    proofImage: run.proofImage ?? undefined,
    createdAt: run.createdAt.toISOString(),
    ranAt: run.ranAt.toISOString(),
    status,
    flags: run.flags,
  };
}
