"use client";

import { ADMIN_MAHIDOL_ID, hashPassword, mahidolIdError, normalizeMahidolId } from "@/lib/auth";
import { formatKm } from "@/lib/format";
import {
  noticeFromRun,
  saveApprovalNotices,
  takeApprovalNotices,
  type ApprovalNotice,
} from "@/lib/notices";
import { facultyStandings, runnerStandings, teamStandings } from "@/lib/ranks";
import {
  bootstrapStore,
  findUserByMahidolId,
  getUser,
  putRun,
  putUser,
  removeRun,
  writeSessionId,
} from "@/lib/storage";
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

type RegisterInput = {
  mahidolId: string;
  password: string;
  name: string;
  faculty: string;
};

type RunsContextValue = {
  ready: boolean;
  bootError: string;
  runs: RunEntry[];
  user: UserAccount | null;
  register: (input: RegisterInput) => Promise<AuthResult>;
  login: (mahidolId: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  submitRun: (run: RunEntry) => Promise<void>;
  updateRun: (run: RunEntry) => Promise<void>;
  approveRun: (id: string) => Promise<void>;
  approveCleanRuns: () => Promise<number>;
  deleteRun: (id: string) => Promise<void>;
};

const RunsContext = createContext<RunsContextValue | null>(null);

export function RunsProvider({ children }: { children: ReactNode }) {
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState("");
  const [toasts, setToasts] = useState<ApprovalNotice[]>([]);
  const runsRef = useRef(runs);
  const userRef = useRef(user);
  useEffect(() => {
    runsRef.current = runs;
  }, [runs]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  function showApprovals(saved: RunEntry[]) {
    const immediate: ApprovalNotice[] = [];
    const later: ApprovalNotice[] = [];
    for (const run of saved) {
      const notice = noticeFromRun(run);
      if (!notice) continue;
      if (userRef.current?.id === run.userId) immediate.push(notice);
      else later.push(notice);
    }
    saveApprovalNotices(later);
    if (immediate.length > 0) {
      setToasts((current) => [...immediate, ...current].slice(0, 4));
    }
  }

  function openStoredApprovals(userId: string) {
    const stored = takeApprovalNotices(userId);
    if (stored.length === 0) return;
    setToasts((current) => [...stored, ...current].slice(0, 4));
  }

  useEffect(() => {
    let cancel = false;
    bootstrapStore()
      .then((data) => {
        if (cancel) return;
        setRuns(data.runs);
        setUser(data.user);
        if (data.user) openStoredApprovals(data.user.id);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (cancel) return;
        setBootError(error instanceof Error ? error.message : "โหลดข้อมูลโซนวิ่งไม่สำเร็จ");
        setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    const mahidolId = normalizeMahidolId(input.mahidolId);
    const idError = mahidolIdError(mahidolId);
    if (idError) return { ok: false, error: idError };
    if (mahidolId === ADMIN_MAHIDOL_ID) {
      return { ok: false, error: "รหัสนี้สงวนไว้สำหรับผู้ดูแลระบบ" };
    }
    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: "กรุณาใส่ชื่อ-นามสกุล" };
    if (!input.faculty) return { ok: false, error: "กรุณาเลือกคณะหรือหน่วยงาน" };
    if (input.password.length < 6) return { ok: false, error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
    const existing = await findUserByMahidolId(mahidolId);
    if (existing) return { ok: false, error: "รหัสนี้ลงทะเบียนแล้ว ลองเข้าสู่ระบบ" };
    const account: UserAccount = {
      id: crypto.randomUUID(),
      mahidolId,
      name,
      faculty: input.faculty,
      role: "member",
      passwordHash: await hashPassword(input.password, mahidolId),
      createdAt: new Date().toISOString(),
    };
    await putUser(account);
    writeSessionId(account.id);
    setUser(account);
    return { ok: true, user: account };
  }, []);

  const login = useCallback(async (mahidolId: string, password: string): Promise<AuthResult> => {
    const id = normalizeMahidolId(mahidolId);
    const idError = mahidolIdError(id);
    if (idError) return { ok: false, error: idError };
    if (!password) return { ok: false, error: "กรุณาใส่รหัสผ่าน" };
    const account = await findUserByMahidolId(id);
    if (!account) return { ok: false, error: "ไม่พบบัญชีจากรหัสนี้" };
    const hash = await hashPassword(password, account.mahidolId);
    if (hash !== account.passwordHash) return { ok: false, error: "รหัสผ่านไม่ถูกต้อง" };
    writeSessionId(account.id);
    setUser(account);
    openStoredApprovals(account.id);
    return { ok: true, user: account };
  }, []);

  const logout = useCallback(() => {
    writeSessionId(null);
    setUser(null);
  }, []);

  const submitRun = useCallback(async (run: RunEntry) => {
    await putRun(run);
    setRuns((prev) => [run, ...prev.filter((item) => item.id !== run.id)]);
    if (!run.userId) return;
    const existing = await getUser(run.userId);
    if (!existing || (existing.team ?? "") === (run.team ?? "")) return;
    const next = { ...existing, team: run.team };
    await putUser(next);
    setUser((current) => (current?.id === next.id ? next : current));
  }, []);

  const updateRun = useCallback(async (run: RunEntry) => {
    await putRun(run);
    setRuns((prev) => prev.map((item) => (item.id === run.id ? run : item)));
  }, []);

  const approveRun = useCallback(async (id: string) => {
    const current = runsRef.current.find((item) => item.id === id);
    if (!current) return;
    const saved: RunEntry = { ...current, status: "verified" };
    await putRun(saved);
    runsRef.current = runsRef.current.map((item) => (item.id === id ? saved : item));
    setRuns((prev) => prev.map((item) => (item.id === id ? saved : item)));
    showApprovals([saved]);
  }, []);

  const approveCleanRuns = useCallback(async () => {
    const targets = runsRef.current.filter((item) => item.status === "pending" && item.flags.length === 0);
    if (targets.length === 0) return 0;
    const saved = targets.map((item) => ({ ...item, status: "verified" as const }));
    for (const run of saved) await putRun(run);
    const ids = new Set(saved.map((item) => item.id));
    runsRef.current = runsRef.current.map((item) =>
      ids.has(item.id) ? { ...item, status: "verified" as const } : item,
    );
    setRuns((prev) => prev.map((item) => (ids.has(item.id) ? { ...item, status: "verified" as const } : item)));
    showApprovals(saved);
    return saved.length;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const deleteRun = useCallback(async (id: string) => {
    await removeRun(id);
    setRuns((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      bootError,
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
      bootError,
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
      {bootError ? (
        <p className="bg-rose-500/15 px-4 py-3 text-center text-sm text-rose-100">{bootError}</p>
      ) : null}
      {children}
      <ApprovalToasts notices={toasts} onDismiss={dismissToast} />
    </RunsContext.Provider>
  );
}

function ApprovalToasts({
  notices,
  onDismiss,
}: {
  notices: ApprovalNotice[];
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
    () =>
      [...runs].sort(
        (a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime(),
      ),
    [runs],
  );
  const standings = useMemo(() => facultyStandings(verified), [verified]);
  const runners = useMemo(() => runnerStandings(verified), [verified]);
  const teams = useMemo(() => teamStandings(verified), [verified]);
  return { ready, standings, runners, teams, runs: verified, feedRuns };
}
