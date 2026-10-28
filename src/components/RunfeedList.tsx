"use client";

import { encodeRunnerSlug, FACULTIES } from "@/lib/faculties";
import { formatDate, formatDuration, formatKm, formatPace } from "@/lib/format";
import type { RunStatus } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { useStandings } from "./RunsProvider";

export function RunfeedList({ highlightId }: { highlightId?: string }) {
  const { ready, feedRuns } = useStandings();
  const [photo, setPhoto] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState("all");
  const [status, setStatus] = useState<"all" | RunStatus>("all");
  const [page, setPage] = useState(0);
  const [pageFilter, setPageFilter] = useState("|all|all");
  const [highlightPinned, setHighlightPinned] = useState(true);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feedRuns.filter((run) => {
      const matchFaculty = faculty === "all" || run.faculty === faculty;
      const matchStatus = status === "all" || run.status === status;
      const matchQuery =
        !q || run.name.toLowerCase().includes(q) || (run.team ?? "").toLowerCase().includes(q);
      return matchFaculty && matchStatus && matchQuery;
    });
  }, [feedRuns, query, faculty, status]);

  const filterKey = `${query}|${faculty}|${status}`;
  const highlightIndex = highlightId ? filtered.findIndex((run) => run.id === highlightId) : -1;
  const highlightPage = highlightIndex >= 0 ? Math.floor(highlightIndex / pageSize) : null;
  const pinned = Boolean(highlightId) && highlightPinned && highlightPage !== null;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = pinned ? highlightPage : pageFilter === filterKey ? page : 0;
  const currentPage = Math.min(requestedPage, pageCount - 1);
  const pageItems = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  if (!ready) return <p className="text-white/60">กำลังโหลด Runfeed...</p>;
  if (feedRuns.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-white/70">ยังไม่มีรายการวิ่ง</p>
        <Link href="/submit" className="mt-4 inline-block text-amber-300 hover:underline">
          บันทึกการวิ่ง
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_180px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="input"
          placeholder="ค้นหาชื่อหรือทีมในฟีด"
        />
        <select value={faculty} onChange={(event) => setFaculty(event.target.value)} className="input">
          <option value="all" className="text-black">
            ทุกคณะ
          </option>
          {FACULTIES.map((item) => (
            <option key={item} value={item} className="text-black">
              {item}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "all" | RunStatus)}
          className="input"
        >
          <option value="all" className="text-black">
            ทุกสถานะ
          </option>
          <option value="verified" className="text-black">
            Verified
          </option>
          <option value="pending" className="text-black">
            Pending
          </option>
        </select>
      </div>
      <div className="grid gap-4">
        {pageItems.map((run) => {
          return (
            <article
              key={run.id}
              className={`grid gap-4 rounded-3xl border p-4 md:grid-cols-[160px_1fr] ${
                highlightId === run.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-white/5"
              }`}
            >
              {run.proofImage ? (
                <button
                  type="button"
                  onClick={() => setPhoto(run.proofImage ?? null)}
                  aria-label={`ดูหลักฐานของ ${run.name}`}
                  className="overflow-hidden rounded-2xl bg-[#0b1b38]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={run.proofImage} alt={`หลักฐานของ ${run.name}`} className="h-40 w-full object-cover" />
                </button>
              ) : (
                <div className="grid h-40 place-items-center rounded-2xl bg-[#0b1b38] text-xs text-white/40">
                  ไม่มีรูปหลักฐาน
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/runner/${encodeRunnerSlug(run.name, run.faculty)}`}
                      className="text-lg font-bold hover:text-amber-300"
                    >
                      {run.name}
                    </Link>
                    <p className="text-sm text-amber-200/80">
                      {run.faculty}
                      {run.team ? ` · ${run.team}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={run.status} />
                    <p className="text-xs text-white/45">{formatDate(run.ranAt)}</p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="ระยะทาง" value={formatKm(run.distanceKm)} />
                  <Stat label="เวลารวม" value={formatDuration(run.durationSec)} />
                  <Stat label="เพซ" value={formatPace(run.paceSecPerKm)} />
                  <Stat label="แคลอรี่" value={`${run.calories.toLocaleString()} kcal`} />
                </dl>
              </div>
            </article>
          );
        })}
      </div>
      {filtered.length === 0 ? <p className="mt-4 text-white/60">ไม่พบรายการตามตัวกรอง</p> : null}
      {filtered.length > pageSize ? (
        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            className="rounded-full border border-white/15 px-4 py-2 disabled:opacity-40"
            disabled={currentPage === 0}
            onClick={() => {
              const base = pinned ? (highlightPage ?? 0) : pageFilter === filterKey ? page : 0;
              setHighlightPinned(false);
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
              const base = pinned ? (highlightPage ?? 0) : pageFilter === filterKey ? page : 0;
              setHighlightPinned(false);
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
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wider text-white/45">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
