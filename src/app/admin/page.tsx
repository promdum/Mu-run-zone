import { AdminPanel } from "@/components/AdminPanel";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "ผู้ดูแลระบบ",
};

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs tracking-[0.3em] text-cyan-200 uppercase">Anti-cheat</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">แผงผู้ดูแล</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          อนุมัติผลวิ่งเข้าลีดเดอร์บอร์ด แก้ไขระยะทางหรือเวลา และลบรายการที่หลักฐานไม่ตรง ระบบตั้งธงให้ถ้าเพซเร็วกว่า
          2:30 นาที/กม. หรือระยะทางต่อครั้งสูงผิดปกติ
        </p>
      </header>
      <Suspense fallback={<p className="text-white/60">กำลังเปิดแผงผู้ดูแล...</p>}>
        <AdminPanel />
      </Suspense>
    </div>
  );
}
