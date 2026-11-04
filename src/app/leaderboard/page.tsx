import { LeaderboardBoard } from "@/components/LeaderboardBoard";
import { liveRequest } from "@/lib/http";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "ลีดเดอร์บอร์ดคณะ",
};

export default async function LeaderboardPage() {
  await liveRequest();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">Faculty Rank</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">ลีดเดอร์บอร์ดคณะ</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          อันดับนับเฉพาะระยะทางที่ผู้ดูแลอนุมัติแล้ว ผลที่ยังรอตรวจสอบอยู่ใน Runfeed และยังไม่ขยับแรงค์ของคณะ
          แรงค์บรอนซ์ เงิน ทอง แพลตินัม เพชร อีลิต และตำนาน บอกความแข็งแกร่งของทีมบนเส้นทางศาลายา
        </p>
      </header>
      <LeaderboardBoard />
    </div>
  );
}
