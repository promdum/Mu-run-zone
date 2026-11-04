"use client";

import { formatCount, formatDate, formatDuration, formatKm, formatPace, parseHms, splitDuration } from "@/lib/format";
import { detectFlags } from "@/lib/moderation";
import type { RunEntry } from "@/lib/types";
import { FormEvent, useMemo, useState } from "react";
import { LoginForm } from "./AuthScreens";
import { StatusBadge } from "./StatusBadge";
import { useRuns } from "./RunsProvider";

type Draft = {
  distance: string;
  hours: string;
  minutes: string;
  seconds: string;
  calories: string;
};

export function AdminPanel() {
  const { ready, user, runs, approveRun, approveCleanRuns, deleteRun, updateRun } = useRuns();
  const [tab, setTab] = useState<"pending" | "verified">("pending");
  const [query, setQuery] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busyId, setBusyId] = useState("");
  const [page, setPage] = useState(0);
  const [pageFilter, setPageFilter] = useState("pending||false");

  const pendingCount = runs.filter((run) => run.status === "pending").length;
  const flaggedCount = runs.filter((run) => run.flags.length > 0 && run.status === "pending").length;
  const cleanCount = runs.filter((run) => run.status === "pending" && run.flags.length === 0).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs
      .filter((run) => run.status === tab)
      .filter((run) => (flaggedOnly ? run.flags.length > 0 : true))
      .filter((run) => {
        if (!q) return true;
        return (
          run.name.toLowerCase().includes(q) ||
          run.faculty.toLowerCase().includes(q) ||
          (run.team ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (tab === "pending" && b.flags.length !== a.flags.length) return b.flags.length - a.flags.length;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [runs, tab, query, flaggedOnly]);

  const filterKey = `${tab}|${query}|${flaggedOnly}`;
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(pageFilter === filterKey ? page : 0, pageCount - 1);
  const pageItems = visible.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  if (!ready) return <p className="text-white/60">กำลังเปิดแผงผู้ดูแล...</p>;
  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-white/70">
          หน้านี้ใช้ตรวจผลวิ่ง แก้ไขระยะทางหรือเวลา และลบรายการที่หลักฐานไม่ตรง เฉพาะบัญชีผู้ดูแลเท่านั้น
        </p>
        <LoginForm adminOnly />
      </div>
    );
  }

  function beginEdit(run: RunEntry) {
    const parts = splitDuration(run.durationSec);
    setEditing(run.id);
    setDraft({
      distance: String(run.distanceKm),
      hours: String(parts.hours),
      minutes: String(parts.minutes),
      seconds: String(parts.seconds),
      calories: String(run.calories),
    });
    setError("");
    setMessage("");
  }

  async function onSave(event: FormEvent, run: RunEntry) {
    event.preventDefault();
    if (!draft) return;
    const distanceKm = Number(draft.distance);
    const durationSec = parseHms(Number(draft.hours) || 0, Number(draft.minutes) || 0, Number(draft.seconds) || 0);
    const calories = Number(draft.calories);
    if (!distanceKm || distanceKm <= 0) return setError("ระยะทางต้องมากกว่า 0");
    if (durationSec <= 0) return setError("เวลาต้องมากกว่า 0");
    if (!Number.isFinite(calories) || calories < 0) return setError("แคลอรี่ไม่ถูกต้อง");
    const paceSecPerKm = durationSec / distanceKm;
    const next: RunEntry = {
      ...run,
      distanceKm,
      durationSec,
      paceSecPerKm,
      calories: Math.round(calories),
      flags: detectFlags({ distanceKm, durationSec, paceSecPerKm, calories }),
    };
    setBusyId(run.id);
    setError("");
    try {
      await updateRun(next);
      setMessage(`แก้ไขผลของ ${run.name} แล้ว ถ้าต้องการให้นับคะแนนคณะ กดอนุมัติอีกครั้ง`);
      setEditing(null);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกการแก้ไขไม่สำเร็จ");
    } finally {
      setBusyId("");
    }
  }

  async function onApprove(run: RunEntry) {
    if (run.flags.length > 0) {
      const ok = window.confirm("รายการนี้ถูกตั้งธงว่าอาจทุจริต ยืนยันอนุมัติเข้าลีดเดอร์บอร์ดหรือไม่?");
      if (!ok) return;
    }
    setBusyId(run.id);
    setError("");
    try {
      await approveRun(run.id);
      setMessage(`อนุมัติ ${run.name} · ${formatKm(run.distanceKm)} เข้าคณะแล้ว`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "อนุมัติไม่สำเร็จ");
    } finally {
      setBusyId("");
    }
  }

  async function onApproveClean() {
    if (cleanCount === 0) return;
    const ok = window.confirm(
      `อนุมัติ ${cleanCount} รายการที่ผ่านเกณฑ์ตรวจทุจริต? รายการที่ถูกตั้งธงจะยังรอตรวจอยู่`,
    );
    if (!ok) return;
    setBusyId("approve-all");
    setError("");
    try {
      const count = await approveCleanRuns();
      setMessage(count > 0 ? `อนุมัติ ${count} รายการที่ผ่านเกณฑ์แล้ว` : "ไม่มีรายการที่ผ่านเกณฑ์ให้อนุมัติ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "อนุมัติทั้งหมดไม่สำเร็จ");
    } finally {
      setBusyId("");
    }
  }

  async function onDelete(run: RunEntry) {
    const ok = window.confirm(`ลบผลวิ่งของ ${run.name} ถาวร? ระยะนี้จะไม่ถูกนับ`);
    if (!ok) return;
    setBusyId(run.id);
    setError("");
    try {
      await deleteRun(run.id);
      setMessage(`ลบผลของ ${run.name} แล้ว`);
      if (editing === run.id) {
        setEditing(null);
        setDraft(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="รอตรวจ" value={`${formatCount(pendingCount)} รายการ`} />
        <Stat label="ถูกตั้งธง" value={`${formatCount(flaggedCount)} รายการ`} />
        <Stat label="ผู้ดูแล" value={user.name} />
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
          รอตรวจ
        </TabButton>
        <TabButton active={tab === "verified"} onClick={() => setTab("verified")}>
          อนุมัติแล้ว
        </TabButton>
        <button
          type="button"
          disabled={cleanCount === 0 || busyId === "approve-all"}
          onClick={onApproveClean}
          className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-bold text-[#062117] disabled:opacity-40"
        >
          {busyId === "approve-all" ? "กำลังอนุมัติ..." : `Approve All (${cleanCount})`}
        </button>
        <button
          type="button"
          onClick={() => setFlaggedOnly((value) => !value)}
          className={`rounded-full px-4 py-2 text-sm ${flaggedOnly ? "bg-rose-400 text-[#2a060c]" : "border border-white/15 text-white/75"}`}
        >
          เฉพาะที่ถูกตั้งธง
        </button>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="input"
        placeholder="ค้นชื่อ คณะ หรือทีม"
      />

      {message ? <p className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-100">{error}</p> : null}

      {visible.length === 0 ? <p className="text-white/60">ไม่มีรายการในมุมมองนี้</p> : null}

      <div className="space-y-4">
        {pageItems.map((run) => {
          return (
            <article key={run.id} className="rounded-3xl border border-white/10 bg-[#071428]/80 p-4">
              <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                {run.proofImage ? (
                  <button
                    type="button"
                    onClick={() => setPhoto(run.proofImage ?? null)}
                    aria-label={`ดูหลักฐานของ ${run.name}`}
                    className="overflow-hidden rounded-2xl bg-black/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={run.proofImage} alt={`หลักฐานของ ${run.name}`} className="h-32 w-full object-cover" />
                  </button>
                ) : (
                  <div className="grid h-32 place-items-center rounded-2xl bg-black/30 text-xs text-white/40">
                    ไม่มีรูปหลักฐาน
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold">{run.name}</h2>
                      <p className="text-sm text-amber-200/80">
                        {run.faculty}
                        {run.team ? ` · ${run.team}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <Mini label="ระยะ" value={formatKm(run.distanceKm)} />
                    <Mini label="เวลา" value={formatDuration(run.durationSec)} />
                    <Mini label="เพซ" value={formatPace(run.paceSecPerKm)} />
                    <Mini label="แคลอรี่" value={`${formatCount(run.calories)} kcal`} />
                  </dl>
                  <p className="mt-2 text-xs text-white/45">วิ่งเมื่อ {formatDate(run.ranAt)}</p>
                  {run.flags.length > 0 ? (
                    <ul className="mt-3 space-y-1">
                      {run.flags.map((flag) => (
                        <li key={flag} className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-100">
                          ธงอัตโนมัติ: {flag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {run.status === "pending" ? (
                      <button
                        type="button"
                        disabled={busyId === run.id}
                        onClick={() => onApprove(run)}
                        className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-bold text-[#062117] disabled:opacity-60"
                      >
                        อนุมัติ
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => (editing === run.id ? setEditing(null) : beginEdit(run))}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm"
                    >
                      {editing === run.id ? "ปิดการแก้ไข" : "แก้ไข"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === run.id}
                      onClick={() => onDelete(run)}
                      className="rounded-full bg-rose-500/80 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      ปฏิเสธและลบ
                    </button>
                  </div>
                  {editing === run.id && draft ? (
                    <form onSubmit={(event) => onSave(event, run)} className="mt-4 grid gap-3 rounded-2xl bg-black/25 p-4 sm:grid-cols-2">
                      <label className="text-sm">
                        ระยะทาง (กม.)
                        <input
                          className="input mt-1"
                          type="number"
                          min="0.1"
                          step="0.01"
                          value={draft.distance}
                          onChange={(event) => setDraft({ ...draft, distance: event.target.value })}
                        />
                      </label>
                      <label className="text-sm">
                        แคลอรี่
                        <input
                          className="input mt-1"
                          type="number"
                          min="0"
                          step="1"
                          value={draft.calories}
                          onChange={(event) => setDraft({ ...draft, calories: event.target.value })}
                        />
                      </label>
                      <label className="text-sm">
                        ชั่วโมง
                        <input
                          className="input mt-1"
                          type="number"
                          min="0"
                          value={draft.hours}
                          onChange={(event) => setDraft({ ...draft, hours: event.target.value })}
                        />
                      </label>
                      <label className="text-sm">
                        นาที
                        <input
                          className="input mt-1"
                          type="number"
                          min="0"
                          value={draft.minutes}
                          onChange={(event) => setDraft({ ...draft, minutes: event.target.value })}
                        />
                      </label>
                      <label className="text-sm">
                        วินาที
                        <input
                          className="input mt-1"
                          type="number"
                          min="0"
                          value={draft.seconds}
                          onChange={(event) => setDraft({ ...draft, seconds: event.target.value })}
                        />
                      </label>
                      <div className="flex items-end">
                        <button type="submit" disabled={busyId === run.id} className="w-full rounded-full bg-amber-300 py-2.5 text-sm font-bold text-[#06122b] disabled:opacity-60">
                          บันทึกระยะทางและเวลา
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visible.length > pageSize ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            className="rounded-full border border-white/15 px-4 py-2 disabled:opacity-40"
            disabled={currentPage === 0}
            onClick={() => {
              const base = pageFilter === filterKey ? page : 0;
              setPageFilter(filterKey);
              setPage(Math.max(0, base - 1));
            }}
          >
            ก่อนหน้า
          </button>
          <p className="text-white/60">
            หน้า {currentPage + 1} / {pageCount}
          </p>
          <button
            type="button"
            className="rounded-full border border-white/15 px-4 py-2 disabled:opacity-40"
            disabled={currentPage >= pageCount - 1}
            onClick={() => {
              const base = pageFilter === filterKey ? page : 0;
              setPageFilter(filterKey);
              setPage(base + 1);
            }}
          >
            ถัดไป
          </button>
        </div>
      ) : null}

      {photo ? (
        <button type="button" className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6" onClick={() => setPhoto(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="หลักฐานการวิ่ง" className="max-h-full max-w-full rounded-2xl" />
        </button>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs tracking-widest text-white/45 uppercase">{label}</p>
      <p className="mt-1 text-xl font-black text-amber-300">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/20 px-3 py-2">
      <dt className="text-[11px] text-white/40">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-amber-300 text-[#06122b]" : "border border-white/15 text-white/75"}`}
    >
      {children}
    </button>
  );
}
