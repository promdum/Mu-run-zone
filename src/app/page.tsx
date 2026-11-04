import { HomeStats } from "@/components/HomeStats";
import { RankShield } from "@/components/RankShield";
import { liveRequest } from "@/lib/http";
import { getRank, RANKS } from "@/lib/ranks";
import type { Metadata } from "next";
import Link from "next/link";

export const instant = false;

export const metadata: Metadata = {
  title: "หน้าแรก",
};

export default async function Home() {
  await liveRequest();
  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#08142c]/80 p-8 md:p-12">
        <p className="text-xs font-semibold tracking-[0.35em] text-amber-300 uppercase">
          Mahidol University · Salaya
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">MU RUN ZONE</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/75">
          พื้นที่วิ่งเพื่อสุขภาพ ความสนุก และความสามัคคี ของนักศึกษาและบุคลากร มหาวิทยาลัยมหิดล
          วิทยาเขตศาลายา รวมระยะทางของแต่ละคณะ แล้วไต่อันดับแรงค์ด้วยกัน
        </p>
        <div className="mt-6 h-1.5 w-48 rounded-full track-line" />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/submit"
            className="rounded-full bg-amber-300 px-6 py-3 font-bold text-[#06122b]"
          >
            บันทึกการวิ่ง
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            ดูลีดเดอร์บอร์ดคณะ
          </Link>
          <Link
            href="/runners"
            className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            อันดับนักวิ่ง
          </Link>
        </div>
      </section>

      <HomeStats />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "สุขภาพ", text: "วิ่งเท่าที่ไหว เก็บระยะทีละกิโล ดูแลใจและร่างกายไปพร้อมกัน" },
          {
            title: "ความสนุก",
            text: "แชร์เพซ รูปหลักฐานจาก Strava หรือสมาร์ทวอทช์ แล้วเชียร์กันใน Runfeed",
          },
          {
            title: "ความสามัคคี",
            text: "ผลที่อนุมัติแล้วไปรวมกับคณะ ดันแรงค์บรอนซ์ถึงตำนานด้วยกัน",
          },
        ].map((item) => (
          <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold text-amber-300">{item.title}</h2>
            <p className="mt-2 text-white/70">{item.text}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">แรงค์ความแข็งแกร่งของคณะ</h2>
            <p className="text-sm text-white/60">ยิ่งวิ่งรวมกันได้มาก แรงค์คณะยิ่งสูง</p>
          </div>
          <Link href="/about" className="text-sm text-amber-300 hover:underline">
            อ่านกติกา
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {RANKS.map((rank) => (
            <div key={rank.id} className="flex flex-col items-center gap-2 text-center">
              <RankShield rank={rank.id} size="md" />
              <p className="text-sm font-bold" style={{ color: getRank(rank.id).color }}>
                {rank.nameEn}
              </p>
              <p className="text-xs text-white/50">{rank.nameTh}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
