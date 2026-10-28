"use client";

import { encodeRunnerSlug } from "@/lib/faculties";
import { formatDate, formatDuration, formatKm, formatPace } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RankShield } from "./RankShield";
import { StatusBadge } from "./StatusBadge";
import { useRuns, useStandings } from "./RunsProvider";

export function ProfilePanel() {
  const router = useRouter();
  const { ready, user, runs, logout } = useRuns();
  const { standings } = useStandings();

  if (!ready) return <p className="text-white/60">กำลังโหลดโปรไฟล์...</p>;
  if (!user) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-white/75">ยังไม่ได้เข้าสู่ระบบ</p>
        <Link href="/login" className="mt-4 inline-block text-amber-300 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  const mine = runs
    .filter((run) => run.userId === user.id)
    .sort((a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime());
  const verifiedKm = mine
    .filter((run) => run.status === "verified")
    .reduce((sum, run) => sum + run.distanceKm, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-300/15 bg-white/5 p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <RankShield
            totalKm={standings.find((row) => row.faculty === user.faculty)?.totalKm ?? 0}
            size="lg"
          />
          <div>
        <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">Profile</p>
        <h1 className="mt-2 text-3xl font-black">{user.name}</h1>
        <p className="mt-2 text-white/70">{user.faculty}</p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <Mini label="รหัสมหิดล" value={user.mahidolId} />
          <Mini label="สถานะ" value={user.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก"} />
          <Mini label="ระยะที่อนุมัติแล้ว" value={formatKm(verifiedKm)} />
        </dl>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/submit" className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-bold text-[#06122b]">
            บันทึกการวิ่ง
          </Link>
          <Link
            href={`/runner/${encodeRunnerSlug(user.name, user.faculty)}`}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold"
          >
            ดูหน้านักวิ่ง
          </Link>
          <button
            type="button"
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">ผลวิ่งของฉัน</h2>
        {mine.length === 0 ? (
          <p className="text-white/60">ยังไม่มีรายการ ผลที่ส่งจะอยู่สถานะ Pending จนกว่าผู้ดูแลจะอนุมัติ</p>
        ) : (
          <div className="space-y-3">
            {mine.map((run) => (
              <article key={run.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-white/50">{formatDate(run.ranAt)}</p>
                  <StatusBadge status={run.status} />
                </div>
                <p className="mt-2 font-semibold">
                  {formatKm(run.distanceKm)} · {formatDuration(run.durationSec)} · {formatPace(run.paceSecPerKm)}
                </p>
                {run.flags.length > 0 && run.status === "pending" ? (
                  <p className="mt-2 text-xs text-rose-200">รอตรวจเป็นพิเศษ: {run.flags.join(" · ")}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/25 px-4 py-3">
      <dt className="text-xs text-white/45">{label}</dt>
      <dd className="mt-1 font-bold text-amber-300">{value}</dd>
    </div>
  );
}
