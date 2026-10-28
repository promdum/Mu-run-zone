import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
      <h1 className="text-3xl font-black">ไม่พบหน้านี้</h1>
      <p className="mt-3 text-white/70">กลับไปที่โซนวิ่งหลักแล้วเลือกเมนูใหม่ได้เลย</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-amber-300 px-5 py-2.5 font-bold text-[#06122b]"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
