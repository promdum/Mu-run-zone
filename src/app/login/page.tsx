import { LoginForm } from "@/components/AuthScreens";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">Mahidol ID</p>
        <h1 className="mt-2 text-3xl font-black">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-white/70">ใช้รหัสนักศึกษาหรือบุคลากรมหาวิทยาลัยมหิดล วิทยาเขตศาลายา</p>
      </header>
      <Suspense fallback={<p className="text-white/60">กำลังเปิดฟอร์ม...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
