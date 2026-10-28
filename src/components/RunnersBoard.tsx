"use client";

import { encodeRunnerSlug, FACULTIES } from "@/lib/faculties";
import { formatKm, formatPace } from "@/lib/format";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RankShield } from "./RankShield";
import { useStandings } from "./RunsProvider";

export function RunnersBoard() {
  const { ready, runners, standings } = useStandings();
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runners.filter((row) => {
      const matchFaculty = faculty === "all" || row.faculty === faculty;
      const matchQuery =
        !q ||
        row.name.toLowerCase().includes(q) ||
        (row.team ?? "").toLowerCase().includes(q);
      return matchFaculty && matchQuery;
    });
  }, [runners, query, faculty]);

  if (!ready) return <p className="text-white/60">กำลังโหลดอันดับนักวิ่ง...</p>;
  if (runners.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-white/70">ยังไม่มีนักวิ่งที่อนุมัติ ผลแรกจะขึ้นอันดับหลังผู้ดูแลตรวจหลักฐาน</p>
        <Link href="/submit" className="mt-4 inline-block text-amber-300 hover:underline">
          บันทึกการวิ่ง
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
          placeholder="ค้นหาชื่อหรือทีม"
        />
        <select value={faculty} onChange={(e) => setFaculty(e.target.value)} className="input">
          <option value="all" className="text-black">
            ทุกคณะ
          </option>
          {FACULTIES.map((item) => (
            <option key={item} value={item} className="text-black">
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-4 py-3">อันดับ</th>
              <th className="px-4 py-3">นักวิ่ง</th>
              <th className="px-4 py-3">ระยะรวม</th>
              <th className="px-4 py-3">ครั้ง</th>
              <th className="px-4 py-3">เพซดีที่สุด</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const rank =
                runners.findIndex((item) => item.name === row.name && item.faculty === row.faculty) +
                1;
              return (
                <tr key={`${row.name}-${row.faculty}`} className="border-t border-white/8 bg-[#071428]/60">
                  <td className="px-4 py-4 font-black text-amber-300">{rank}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <RankShield
                        totalKm={standings.find((item) => item.faculty === row.faculty)?.totalKm ?? 0}
                        size="sm"
                      />
                      <div>
                    <Link
                      href={`/runner/${encodeRunnerSlug(row.name, row.faculty)}`}
                      className="font-medium hover:text-amber-300"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs text-white/45">
                      {row.faculty}
                      {row.team ? ` · ${row.team}` : ""}
                    </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold">{formatKm(row.totalKm)}</td>
                  <td className="px-4 py-4">{row.totalRuns}</td>
                  <td className="px-4 py-4">{formatPace(row.bestPaceSec)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 ? (
        <p className="text-white/60">ไม่พบนักวิ่งตามคำค้น</p>
      ) : null}
    </div>
  );
}
