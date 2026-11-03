"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RunfeedList } from "./RunfeedList";

export function RunfeedPageClient() {
  const posted = useSearchParams().get("posted") ?? undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">Personal Feed</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Runfeed</h1>
          <p className="mt-2 max-w-2xl text-white/70">
            การ์ดผลวิ่งขึ้นฟีดทันที รายการที่ยังไม่ตรวจมีป้ายเหลืองว่า รอตรวจสอบ และยังไม่นับเข้าลีดเดอร์บอร์ดจนกว่าผู้ดูแลจะอนุมัติ
          </p>
        </div>
        <Link
          href="/submit"
          className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-bold text-[#06122b]"
        >
          เพิ่มการวิ่ง
        </Link>
      </header>
      {posted ? (
        <p className="rounded-2xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          ส่งผลวิ่งแล้ว สถานะเป็น Pending จนกว่าผู้ดูแลจะอนุมัติ ระยะจึงจะรวมเข้าคณะ
        </p>
      ) : null}
      <RunfeedList highlightId={posted} />
    </div>
  );
}
