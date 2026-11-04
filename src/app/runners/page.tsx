import { RunnersBoard } from "@/components/RunnersBoard";
import { liveRequest } from "@/lib/http";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "อันดับนักวิ่ง",
};

export default async function RunnersPage() {
  await liveRequest();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">Individual Rank</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">ลีดเดอร์บอร์ดนักวิ่ง</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          อันดับรายบุคคลจากระยะทางสะสม ใช้ชื่อเดียวกันและคณะเดียวกันเพื่อให้ระบบรวมประวัติให้อัตโนมัติ
        </p>
      </header>
      <RunnersBoard />
    </div>
  );
}
