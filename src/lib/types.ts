export type RankId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "elite"
  | "legend";

export type RunStatus = "pending" | "verified";

export type UserRole = "member" | "admin";

export type RunEntry = {
  id: string;
  userId?: string;
  name: string;
  faculty: string;
  team?: string;
  distanceKm: number;
  durationSec: number;
  paceSecPerKm?: number;
  calories: number;
  proofImage?: string;
  createdAt: string;
  ranAt: string;
  status: RunStatus;
  flags: string[];
};

export type UserAccount = {
  id: string;
  mahidolId: string;
  name: string;
  faculty: string;
  team?: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
};

export type FacultyStanding = {
  faculty: string;
  totalKm: number;
  cappedKm: number;
  totalRuns: number;
  runners: number;
  rank: RankId;
  nextRank: RankId | null;
  kmToNext: number;
  progress: number;
};

export type RunnerStanding = {
  name: string;
  faculty: string;
  team?: string;
  totalKm: number;
  totalRuns: number;
  calories: number;
  bestPaceSec?: number;
  lastRunAt: string;
};

export type TeamStanding = {
  team: string;
  faculty: string;
  totalKm: number;
  totalRuns: number;
  runners: number;
};

export type AuthResult =
  | { ok: true; user: UserAccount }
  | { ok: false; error: string };
