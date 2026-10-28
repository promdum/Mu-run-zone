"use client";

import { encodeRunnerSlug, facultyFromSlug } from "@/lib/faculties";
import { formatDate, formatKm, formatPace } from "@/lib/format";
import Link from "next/link";
import { RankBadge } from "./RankBadge";
import { RankShield } from "./RankShield";
import { StatusBadge } from "./StatusBadge";
import { useStandings } from "./RunsProvider";

export function FacultyDetail({ slug }: { slug: string }) {
  const faculty = facultyFromSlug(slug);
  const { ready, standings, runners, feedRuns } = useStandings();

  if (!faculty) {
    return <p className="text-white/70">ไม่พบคณะนี้</p>;
  }
  if (!ready) return <p className="text-white/60">กำลังโหลดข้อมูลคณะ...</p>;

  const standing = standings.find((row) => row.faculty === faculty);
  const members = runners.filter((row) => row.faculty === faculty);
  const recent = feedRuns.filter((run) => run.faculty === faculty).slice(0, 8);
  const place = standing ? standings.findIndex((row) => row.faculty === faculty) + 1 : 0;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <RankShield totalKm={standing?.totalKm ?? 0} size="xl" priority />
          <div>
            <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">Faculty Team</p>
            <h1 className="mt-2 text-3xl font-black">{faculty}</h1>
            {standing ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <RankBadge rank={standing.rank} />
                <p className="text-white/70">อันดับ {place} ของวิทยาเขต</p>
              </div>
            ) : null}
          </div>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Mini label="ระยะรวม" value={formatKm(standing?.totalKm ?? 0)} />
          <Mini label="นักวิ่ง" value={`${standing?.runners ?? 0} คน`} />
          <Mini label="กิจกรรม" value={`${standing?.totalRuns ?? 0} รายการ`} />
        </dl>
        {standing?.nextRank ? (
          <p className="mt-4 text-sm text-white/60">
            อีก {formatKm(standing.kmToNext)} จะขึ้นแรงค์ถัดไป
          </p>
        ) : (
          <p className="mt-4 text-sm text-amber-200">คณะนี้ครองแรงค์ตำนานแล้ว</p>
        )}
      </header>

      <section>
        <h2 className="mb-4 text-xl font-bold">สมาชิกที่วิ่งให้คณะ</h2>
        {members.length === 0 ? (
          <p className="text-white/60">ยังไม่มีนักวิ่งจากคณะนี้</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {members.map((row) => (
              <Link
                key={row.name}
                href={`/runner/${encodeRunnerSlug(row.name, row.faculty)}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 hover:bg-white/10"
              >
                <RankShield totalKm={standing?.totalKm ?? 0} size="sm" />
                <span>
                <p className="font-semibold">{row.name}</p>
                <p className="text-sm text-amber-200/80">{formatKm(row.totalKm)}</p>
                <p className="text-xs text-white/45">
                  {row.totalRuns} ครั้ง · เพซดีที่สุด {formatPace(row.bestPaceSec)}
                </p>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">กิจกรรมล่าสุด</h2>
        {recent.length === 0 ? (
          <p className="text-white/60">ยังไม่มีกิจกรรม</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((run) => (
              <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-3">
                <span>
                  {run.name} · {formatKm(run.distanceKm)}
                  <span className="mt-1 block text-xs text-white/45">{formatDate(run.ranAt)}</span>
                </span>
                <StatusBadge status={run.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/submit" className="inline-flex rounded-full bg-amber-300 px-5 py-2.5 font-bold text-[#06122b]">
        วิ่งให้ {faculty}
      </Link>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 px-4 py-3">
      <dt className="text-xs text-white/45">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-amber-300">{value}</dd>
    </div>
  );
}
