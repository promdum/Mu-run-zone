import { SubmitForm } from "@/components/SubmitForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "บันทึกการวิ่ง",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">Log a run</p>
        <h1 className="mt-2 text-3xl font-black">บันทึกการวิ่ง</h1>
        <p className="mt-2 text-white/70">
          ใส่ระยะทาง เวลา เพซถ้ามี แคลอรี่ และรูปจาก Strava หรือสมาร์ทวอทช์ ชื่อกับคณะมาจากบัญชีที่เข้าสู่ระบบ
          ผลจะขึ้น Runfeed เป็น Pending และนับเข้าลีดเดอร์บอร์ดเมื่อผู้ดูแลอนุมัติ
        </p>
      </header>
      <Suspense fallback={<p className="text-white/60">กำลังเปิดฟอร์ม...</p>}>
        <SubmitForm />
      </Suspense>
    </div>
  );
}
