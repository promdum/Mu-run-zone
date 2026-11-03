import type { RunEntry } from "./types";

const STORAGE_KEY = "mu-runzone-approval-notices-v1";

export type ApprovalNotice = {
  id: string;
  userId: string;
  distanceKm: number;
  faculty: string;
};

function readAll(): ApprovalNotice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ApprovalNotice[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.id && item.userId) : [];
  } catch {
    return [];
  }
}

function writeAll(notices: ApprovalNotice[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
}

export function noticeFromRun(run: RunEntry): ApprovalNotice | null {
  if (!run.userId) return null;
  return {
    id: run.id,
    userId: run.userId,
    distanceKm: run.distanceKm,
    faculty: run.faculty,
  };
}

export function saveApprovalNotices(notices: ApprovalNotice[]) {
  if (notices.length === 0) return;
  const existing = readAll();
  const ids = new Set(existing.map((item) => item.id));
  writeAll([...existing, ...notices.filter((item) => !ids.has(item.id))]);
}

export function takeApprovalNotices(userId: string): ApprovalNotice[] {
  const all = readAll();
  const mine = all.filter((item) => item.userId === userId);
  if (mine.length === 0) return [];
  writeAll(all.filter((item) => item.userId !== userId));
  return mine;
}
