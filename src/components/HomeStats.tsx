"use client";

import { formatCount, formatKm } from "@/lib/format";
import { encodeRunnerSlug, slugFromFaculty } from "@/lib/faculties";
import Link from "next/link";
import { RankBadge } from "./RankBadge";
import { RankShield } from "./RankShield";
import { useStandings } from "./RunsProvider";

export function HomeStats() {
  const { ready, standings, runners, runs } = useStandings();
  if (!ready) {
    return <p className="text-white/60">กำลังโหลดสถิติโซนวิ่ง...</p>;
  }

  const totalKm = runs.reduce((sum, run) => sum + run.distanceKm, 0);
  const calories = runs.reduce((sum, run) => sum + run.calories, 0);
  const latest = [...runs]
    .sort((a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="ระยะทางรวมทั้งโซน" value={formatKm(totalKm)} />
        <Stat label="กิจกรรมวิ่ง" value={`${formatCount(runs.length)} รายการ`} />
        <Stat label="นักวิ่ง" value={`${formatCount(runners.length)} คน`} />
        <Stat label="แคลอรี่รวม" value={`${formatCount(calories)} kcal`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">คณะนำอยู่</h2>
            <Link href="/leaderboard" className="text-sm text-amber-300 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          <ol className="space-y-3">
            {standings.slice(0, 5).map((row, i) => (
              <li key={row.faculty}>
                <Link
                  href={`/faculty/${slugFromFaculty(row.faculty)}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-3 hover:bg-black/30"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <RankShield totalKm={row.totalKm} size="sm" />
                    <span className="w-6 font-black text-amber-300">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{row.faculty}</span>
                      <RankBadge rank={row.rank} size="sm" />
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold">{formatKm(row.cappedKm)}</span>
                    <span className="block text-xs text-white/45">{row.runners} คน</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">นักวิ่งนำอยู่</h2>
            <Link href="/runners" className="text-sm text-amber-300 hover:underline">
              ดูอันดับบุคคล
            </Link>
          </div>
          <ol className="space-y-3">
            {runners.slice(0, 5).map((row, i) => (
              <li key={`${row.name}-${row.faculty}`}>
                <Link
                  href={`/runner/${encodeRunnerSlug(row.name, row.faculty)}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-3 hover:bg-black/30"
                >
                  <span className="min-w-0">
                    <span className="font-black text-amber-300">{i + 1} </span>
                    <span className="font-medium">{row.name}</span>
                    <span className="block truncate text-xs text-white/50">{row.faculty}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatKm(row.totalKm)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">วิ่งล่าสุดในโซน</h2>
          <Link href="/runfeed" className="text-sm text-amber-300 hover:underline">
            เปิด Runfeed
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-white/70">
            ยังไม่มีผลที่อนุมัติ ลงทะเบียนแล้วส่งหลักฐานจากแอปวิ่งได้เลย ระยะจะขึ้นบอร์ดเมื่อผู้ดูแลกดอนุมัติ
          </p>
        ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {latest.map((run) => (
            <Link
              key={run.id}
              href={`/runner/${encodeRunnerSlug(run.name, run.faculty)}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 hover:bg-white/10"
            >
              <p className="font-semibold">{run.name}</p>
              <p className="text-sm text-amber-200/80">{run.faculty}</p>
              <p className="mt-2 text-white/70">
                {formatKm(run.distanceKm)} · {formatCount(run.calories)} kcal
              </p>
            </Link>
          ))}
        </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5">
      <p className="text-xs tracking-widest text-white/50 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-black text-amber-300">{value}</p>
    </div>
  );
}
