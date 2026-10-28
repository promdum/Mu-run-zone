import { RegisterForm } from "@/components/AuthScreens";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ลงทะเบียน",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">Join the zone</p>
        <h1 className="mt-2 text-3xl font-black">ลงทะเบียน</h1>
        <p className="mt-2 text-white/70">
          สร้างบัญชีด้วยรหัสมหิดล ชื่อ และคณะ แล้วใช้บัญชีนี้ส่งผลวิ่งเข้า MU RUN ZONE
        </p>
      </header>
      <RegisterForm />
    </div>
  );
}
