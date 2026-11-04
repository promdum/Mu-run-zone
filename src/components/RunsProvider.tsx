"use client";

import { formatKm } from "@/lib/format";
import { facultyStandings, runnerStandings, teamStandings } from "@/lib/ranks";
import type { AuthResult, RunEntry, UserAccount } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SessionUser = Omit<UserAccount, "passwordHash">;

type RegisterInput = {
  mahidolId: string;
  password: string;
  name: string;
  faculty: string;
};

type RunsContextValue = {
  ready: boolean;
  runs: RunEntry[];
  user: SessionUser | null;
  register: (input: RegisterInput) => Promise<AuthResult>;
  login: (mahidolId: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  submitRun: (run: RunEntry) => Promise<void>;
  updateRun: (run: RunEntry) => Promise<void>;
  approveRun: (id: string) => Promise<void>;
  approveCleanRuns: () => Promise<number>;
  deleteRun: (id: string) => Promise<void>;
};

type ToastNotice = {
  id: string;
  distanceKm: number;
  faculty: string;
};

const SEEN_PENDING_KEY = "mu-runzone-seen-pending";

const RunsContext = createContext<RunsContextValue | null>(null);

async function requestJson<T>(url: string, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const data = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
      if (fallback !== undefined && response.status >= 500) return fallback;
      throw new Error(data.error || "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    }
    return data;
  } catch (error) {
    if (fallback !== undefined) return fallback;
    if (error instanceof Error) throw error;
    throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
  }
}

function readSeenPending() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN_PENDING_KEY) || "[]") as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSeenPending(ids: string[]) {
  window.localStorage.setItem(SEEN_PENDING_KEY, JSON.stringify(ids));
}

export function RunsProvider({ children }: { children: ReactNode }) {
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const runsRef = useRef(runs);
  const userRef = useRef(user);
  useEffect(() => {
    runsRef.current = runs;
  }, [runs]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const noteApprovals = useCallback((nextRuns: RunEntry[], viewer: SessionUser | null) => {
    const seen = readSeenPending();
    const mine = nextRuns.filter((run) => viewer && run.userId === viewer.id);
    const stillPending = mine.filter((run) => run.status === "pending").map((run) => run.id);
    const approved = mine.filter((run) => run.status === "verified" && seen.includes(run.id));
    writeSeenPending(stillPending);
    if (approved.length === 0) return;
    setToasts((current) =>
      [
        ...approved.map((run) => ({ id: run.id, distanceKm: run.distanceKm, faculty: run.faculty })),
        ...current,
      ].slice(0, 4),
    );
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [nextRuns, session] = await Promise.all([
        requestJson<RunEntry[]>("/api/runs", undefined, []),
        requestJson<{ user: SessionUser | null }>("/api/auth/session", undefined, {
          user: userRef.current,
        }),
      ]);
      noteApprovals(nextRuns, session.user);
      setRuns(nextRuns);
      setUser(session.user);
      runsRef.current = nextRuns;
      userRef.current = session.user;
    } catch {
      return;
    }
  }, [noteApprovals]);

  useEffect(() => {
    let cancel = false;
    const boot = window.setTimeout(() => {
      refresh().finally(() => {
        if (!cancel) setReady(true);
      });
    }, 0);
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 12000);
    const onFocus = () => {
      refresh().catch(() => undefined);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancel = true;
      window.clearTimeout(boot);
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    try {
      const data = await requestJson<{ user: SessionUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setUser(data.user);
      userRef.current = data.user;
      return { ok: true, user: { ...data.user, passwordHash: "" } };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "ลงทะเบียนไม่สำเร็จ" };
    }
  }, []);

  const login = useCallback(async (mahidolId: string, password: string): Promise<AuthResult> => {
    try {
      const data = await requestJson<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ mahidolId, password }),
      });
      setUser(data.user);
      userRef.current = data.user;
      await refresh();
      return { ok: true, user: { ...data.user, passwordHash: "" } };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ" };
    }
  }, [refresh]);

  const logout = useCallback(() => {
    void requestJson("/api/auth/logout", { method: "POST", body: "{}" }).finally(() => {
      setUser(null);
      userRef.current = null;
    });
  }, []);

  const submitRun = useCallback(async (run: RunEntry) => {
    const saved = await requestJson<RunEntry>("/api/runs", {
      method: "POST",
      body: JSON.stringify(run),
    });
    setRuns((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
    await refresh();
  }, [refresh]);

  const updateRun = useCallback(async (run: RunEntry) => {
    await requestJson<RunEntry>(`/api/runs/${run.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        distanceKm: run.distanceKm,
        durationSec: run.durationSec,
        calories: run.calories,
      }),
    });
    await refresh();
  }, [refresh]);

  const approveRun = useCallback(async (id: string) => {
    await requestJson<RunEntry>(`/api/runs/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ approve: true }),
    });
    await refresh();
  }, [refresh]);

  const approveCleanRuns = useCallback(async () => {
    const data = await requestJson<{ count: number }>("/api/runs/approve-clean", {
      method: "POST",
      body: "{}",
    });
    await refresh();
    return data.count;
  }, [refresh]);

  const deleteRun = useCallback(async (id: string) => {
    await requestJson(`/api/runs/${id}`, { method: "DELETE" });
    setRuns((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      runs,
      user,
      register,
      login,
      logout,
      submitRun,
      updateRun,
      approveRun,
      approveCleanRuns,
      deleteRun,
    }),
    [
      ready,
      runs,
      user,
      register,
      login,
      logout,
      submitRun,
      updateRun,
      approveRun,
      approveCleanRuns,
      deleteRun,
    ],
  );

  return (
    <RunsContext.Provider value={value}>
      {children}
      <ApprovalToasts notices={toasts} onDismiss={dismissToast} />
    </RunsContext.Provider>
  );
}

function ApprovalToasts({
  notices,
  onDismiss,
}: {
  notices: ToastNotice[];
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (notices.length === 0) return;
    const oldest = notices[notices.length - 1];
    const timer = window.setTimeout(() => onDismiss(oldest.id), 7000);
    return () => window.clearTimeout(timer);
  }, [notices, onDismiss]);

  if (notices.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className="pointer-events-auto rounded-2xl border border-emerald-300/50 bg-[#062117]/95 px-4 py-3 text-sm text-emerald-50 shadow-[0_12px_40px_rgba(16,185,129,0.25)]"
          role="status"
        >
          <p className="font-bold">ผลวิ่งได้รับการอนุมัติแล้ว</p>
          <p className="mt-1 text-emerald-100/80">
            {formatKm(notice.distanceKm)} นับเข้าลีดเดอร์บอร์ดของ {notice.faculty}
          </p>
          <button type="button" className="mt-2 text-xs text-emerald-200 underline" onClick={() => onDismiss(notice.id)}>
            ปิด
          </button>
        </div>
      ))}
    </div>
  );
}

export function useRuns() {
  const ctx = useContext(RunsContext);
  if (!ctx) throw new Error("useRuns must be used within RunsProvider");
  return ctx;
}

export function useStandings() {
  const { runs, ready } = useRuns();
  const verified = useMemo(() => runs.filter((run) => run.status === "verified"), [runs]);
  const feedRuns = useMemo(
    () => [...runs].sort((a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime()),
    [runs],
  );
  const standings = useMemo(() => facultyStandings(verified), [verified]);
  const runners = useMemo(() => runnerStandings(verified), [verified]);
  const teams = useMemo(() => teamStandings(verified), [verified]);
  return { ready, standings, runners, teams, runs: verified, feedRuns };
}
