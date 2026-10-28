"use client";

import { decodeRunnerSlug, slugFromFaculty } from "@/lib/faculties";
import { formatDate, formatDuration, formatKm, formatPace } from "@/lib/format";
import Link from "next/link";
import { RankShield } from "./RankShield";
import { StatusBadge } from "./StatusBadge";
import { useStandings } from "./RunsProvider";

export function RunnerProfile({ slug }: { slug: string }) {
  const identity = decodeRunnerSlug(slug);
  const { ready, runners, feedRuns, standings } = useStandings();

  if (!identity) return <p className="text-white/70">ไม่พบนักวิ่งคนนี้</p>;
  if (!ready) return <p className="text-white/60">กำลังโหลดโปรไฟล์นักวิ่ง...</p>;

  const standing = runners.find(
    (row) => row.name === identity.name && row.faculty === identity.faculty,
  );
  const history = feedRuns.filter(
    (run) => run.name.trim() === identity.name && run.faculty === identity.faculty,
  );
  const place = standing
    ? runners.findIndex((row) => row.name === standing.name && row.faculty === standing.faculty) + 1
    : 0;

  if (!standing && history.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-white/70">ยังไม่มีประวัติวิ่งของ {identity.name}</p>
        <Link href="/submit" className="text-amber-300 hover:underline">
          บันทึกการวิ่ง
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <RankShield
            totalKm={standings.find((row) => row.faculty === identity.faculty)?.totalKm ?? 0}
            size="xl"
            priority
          />
          <div>
        <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">Runner</p>
        <h1 className="mt-2 text-3xl font-black">{standing?.name ?? identity.name}</h1>
        <Link
          href={`/faculty/${slugFromFaculty(identity.faculty)}`}
          className="mt-2 inline-block text-amber-200/80 hover:underline"
        >
          {identity.faculty}
          {standing?.team ? ` · ${standing.team}` : ""}
        </Link>
        <p className="mt-3 text-white/70">
          {standing ? `อันดับนักวิ่งที่ ${place} ของโซน จากผลที่อนุมัติแล้ว` : "ยังไม่มีระยะที่อนุมัติแล้ว"}
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-4">
          <Mini label="ระยะรวม" value={formatKm(standing?.totalKm ?? 0)} />
          <Mini label="ครั้งที่อนุมัติ" value={`${standing?.totalRuns ?? 0}`} />
          <Mini label="แคลอรี่" value={`${(standing?.calories ?? 0).toLocaleString()} kcal`} />
          <Mini label="เพซดีที่สุด" value={formatPace(standing?.bestPaceSec)} />
        </dl>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-bold">ประวัติการวิ่ง</h2>
        <div className="space-y-3">
          {history.map((run) => (
            <article key={run.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-white/45">{formatDate(run.ranAt)}</p>
                <StatusBadge status={run.status} />
              </div>
              <p className="mt-1 font-semibold">
                {formatKm(run.distanceKm)} · {formatDuration(run.durationSec)} · {formatPace(run.paceSecPerKm)}
              </p>
            </article>
          ))}
        </div>
      </section>
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
