import { RankBadge } from "@/components/RankBadge";
import { RankShield } from "@/components/RankShield";
import { rankBand, RANKS } from "@/lib/ranks";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "กติกาและแรงค์",
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs tracking-[0.3em] text-amber-300 uppercase">How it works</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">กติกา MU RUN ZONE</h1>
        <p className="mt-3 max-w-2xl text-white/70">
          โซนวิ่งของนักศึกษาและบุคลากรมหาวิทยาลัยมหิดล วิทยาเขตศาลายา เพื่อสุขภาพ ความสนุก
          และความสามัคคี
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            step: "1",
            title: "วิ่งแล้วเก็บหลักฐาน",
            text: "ใช้ Strava Garmin Apple Fitness หรือแอปสมาร์ทวอทช์ แล้วแคปหน้าจอสรุปการวิ่ง",
          },
          {
            step: "2",
            title: "บันทึกในโซน",
            text: "ใส่ชื่อ คณะ ระยะทาง เวลา แคลอรี่ และอัปโหลดรูป เพซไม่ใส่ก็ได้ ระบบคำนวณให้",
          },
          {
            step: "3",
            title: "ดันแรงค์คณะ",
            text: "หลังผู้ดูแลอนุมัติ ระยะทางไปรวมกับคณะ ดูได้ทั้งลีดเดอร์บอร์ด อันดับบุคคล และ Runfeed",
          },
        ].map((item) => (
          <article key={item.step} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-black text-amber-300">ขั้นที่ {item.step}</p>
            <h2 className="mt-2 text-xl font-bold">{item.title}</h2>
            <p className="mt-2 text-white/70">{item.text}</p>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold">เกณฑ์แรงค์คณะ</h2>
        <p className="mt-2 text-white/65">
          คิดจากระยะทางรวมของทุกคนในคณะ ไม่ใช่ระยะของคนใดคนหนึ่ง
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {RANKS.map((rank) => (
            <div
              key={rank.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <RankShield rank={rank.id} size="sm" />
                <div>
                  <RankBadge rank={rank.id} />
                  <p className="mt-1 text-sm text-white/55">{rank.motto}</p>
                </div>
              </div>
              <p className="text-sm text-white/75">{rankBand(rank.id)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-bold">ข้อแนะนำในการใช้</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-white/70">
          <li>ลงทะเบียนด้วยรหัสนักศึกษาหรือบุคลากรมหิดล ชื่อและคณะจะถูกผูกกับบัญชี</li>
          <li>ผลที่ส่งใหม่เป็น Pending จนกว่าผู้ดูแลจะกดอนุมัติ จึงนับเข้าแรงค์คณะ</li>
          <li>ระบบตั้งธงอัตโนมัติถ้าเพซเร็วกว่า 2:30 นาที/กม. หรือระยะทางต่อครั้งเกิน 80 กม.</li>
          <li>ผู้ดูแลแก้ไขระยะทางและเวลาได้ หรือปฏิเสธและลบรายการที่หลักฐานไม่ตรง</li>
          <li>ข้อมูลเก็บใน IndexedDB ของเบราว์เซอร์เครื่องนี้</li>
        </ul>
        <Link
          href="/submit"
          className="mt-6 inline-flex rounded-full bg-amber-300 px-5 py-2.5 font-bold text-[#06122b]"
        >
          เริ่มบันทึกการวิ่ง
        </Link>
      </section>
    </div>
  );
}
