import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#040b1c] py-8 text-sm text-white/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
        <p className="font-semibold text-amber-200/80">MU RUN ZONE</p>
        <p>
          ชุมชนวิ่งเพื่อสุขภาพ ความสนุก และความสามัคคี · มหาวิทยาลัยมหิดล วิทยาเขตศาลายา
        </p>
        <nav className="flex flex-wrap justify-center gap-4 text-white/70">
          <Link href="/leaderboard" className="hover:text-amber-300">
            ลีดเดอร์บอร์ดคณะ
          </Link>
          <Link href="/runners" className="hover:text-amber-300">
            อันดับนักวิ่ง
          </Link>
          <Link href="/runfeed" className="hover:text-amber-300">
            Runfeed
          </Link>
          <Link href="/about" className="hover:text-amber-300">
            กติกาและแรงค์
          </Link>
          <Link href="/login" className="hover:text-amber-300">
            เข้าสู่ระบบ
          </Link>
          <Link href="/admin" className="hover:text-amber-300">
            ผู้ดูแล
          </Link>
        </nav>
      </div>
    </footer>
  );
}
