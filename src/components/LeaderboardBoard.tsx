"use client";

import { slugFromFaculty } from "@/lib/faculties";
import { formatKm } from "@/lib/format";
import { getRank, rankBand, RANKS } from "@/lib/ranks";
import Link from "next/link";
import { RankBadge } from "./RankBadge";
import { RankShield } from "./RankShield";
import { useStandings } from "./RunsProvider";

export function LeaderboardBoard() {
  const { ready, standings, teams } = useStandings();

  if (!ready) return <p className="text-white/60">กำลังโหลดอันดับคณะ...</p>;

  const hasDistance = standings.some((row) => row.totalKm > 0);

  return (
    <div className="space-y-8">
      {hasDistance ? null : (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
          ทุกคณะเริ่มที่บรอนซ์ 0 กม. ระยะจะขยับเมื่อมีผลวิ่งที่ผู้ดูแลอนุมัติแล้ว
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {standings.slice(0, 4).map((row, i) => {
          const rank = getRank(row.rank);
          return (
            <Link
              key={row.faculty}
              href={`/faculty/${slugFromFaculty(row.faculty)}`}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center hover:bg-white/10"
              style={{ boxShadow: i === 0 ? `0 0 40px ${rank.glow}` : undefined }}
            >
              <div className="mb-3 flex justify-center">
                <RankShield totalKm={row.totalKm} size="lg" priority={i === 0} />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300">อันดับ {i + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{row.faculty}</h3>
              <p className="mt-1 text-2xl font-black text-amber-300">{formatKm(row.totalKm)}</p>
              <p className="mt-1 text-sm text-white/60">{row.runners} นักวิ่ง</p>
              <div className="mt-3">
                <RankBadge rank={row.rank} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-4 py-3">อันดับ</th>
              <th className="px-4 py-3">คณะ / หน่วยงาน</th>
              <th className="px-4 py-3">แรงค์</th>
              <th className="px-4 py-3">ระยะรวม</th>
              <th className="px-4 py-3">นักวิ่ง</th>
              <th className="px-4 py-3">ไปยังแรงค์ถัดไป</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const next = row.nextRank ? getRank(row.nextRank) : null;
              return (
                <tr key={row.faculty} className="border-t border-white/8 bg-[#071428]/60">
                  <td className="px-4 py-4 font-black text-amber-300">{i + 1}</td>
                  <td className="px-4 py-4">
                    <Link href={`/faculty/${slugFromFaculty(row.faculty)}`} className="hover:text-amber-300">
                      <p className="font-medium">{row.faculty}</p>
                      <p className="text-xs text-white/45">{row.totalRuns} กิจกรรม</p>
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <RankShield totalKm={row.totalKm} size="sm" />
                      <RankBadge rank={row.rank} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold">{formatKm(row.totalKm)}</td>
                  <td className="px-4 py-4">{row.runners} คน</td>
                  <td className="px-4 py-4">
                    {next ? (
                      <div>
                        <div className="mb-1 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${row.progress}%`, background: getRank(row.rank).color }}
                          />
                        </div>
                        <p className="text-xs text-white/50">
                          อีก {formatKm(row.kmToNext)} สู่ {next.nameTh}
                        </p>
                      </div>
                    ) : (
                      <span className="text-amber-200">ครองตำนานแล้ว</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {teams.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-bold">ทีมที่รวมระยะได้มาก</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {teams.slice(0, 6).map((team) => (
              <article key={`${team.team}-${team.faculty}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="font-semibold">{team.team}</p>
                <p className="text-sm text-white/55">{team.faculty}</p>
                <p className="mt-2 text-amber-300">{formatKm(team.totalKm)}</p>
                <p className="text-xs text-white/45">
                  {team.runners} คน · {team.totalRuns} กิจกรรม
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-xl font-bold">เกณฑ์แรงค์คณะ</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {RANKS.map((rank) => (
            <div
              key={rank.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <RankShield rank={rank.id} size="sm" />
                <div>
                  <RankBadge rank={rank.id} />
                  <p className="mt-1 text-xs text-white/50">{rank.motto}</p>
                </div>
              </div>
              <p className="text-sm text-white/70">{rankBand(rank.id)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
