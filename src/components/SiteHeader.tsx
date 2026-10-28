"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useRuns } from "./RunsProvider";

const LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/leaderboard", label: "ลีดเดอร์บอร์ด" },
  { href: "/runners", label: "นักวิ่ง" },
  { href: "/runfeed", label: "Runfeed" },
  { href: "/about", label: "กติกา" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, runs } = useRuns();
  const [open, setOpen] = useState(false);
  const pending = user?.role === "admin" ? runs.filter((run) => run.status === "pending").length : 0;
  const adminOn = pathname.startsWith("/admin");

  function close() {
    setOpen(false);
  }

  function toggleAdmin() {
    if (user?.role === "admin") {
      router.push(adminOn ? "/" : "/admin");
      close();
      return;
    }
    router.push("/admin");
    close();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-300/15 bg-[#06122b]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3" onClick={close}>
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-cyan-300 text-sm font-black text-[#06122b] shadow-[0_0_24px_rgba(245,197,66,0.45)]">
            MU
          </span>
          <span>
            <span className="block text-sm font-black tracking-[0.18em] text-amber-300">MU RUN ZONE</span>
            <span className="block text-[11px] text-white/60">มหาวิทยาลัยมหิดล · ศาลายา</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} pathname={pathname} label={link.label} />
          ))}
          <Link
            href="/submit"
            className="ml-1 rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-[#06122b]"
          >
            บันทึกการวิ่ง
          </Link>
          <AdminSwitch on={adminOn} pending={pending} onToggle={toggleAdmin} />
          {user ? (
            <Link
              href="/profile"
              className={`max-w-40 truncate rounded-full px-3 py-2 text-sm ${
                pathname.startsWith("/profile") ? "bg-white text-[#06122b]" : "text-white/80 hover:bg-white/10"
              }`}
            >
              {user.name}
            </Link>
          ) : (
            <Link href="/login" className="rounded-full px-3 py-2 text-sm text-cyan-100 hover:bg-white/10">
              เข้าสู่ระบบ
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="เปิดเมนู"
        >
          เมนู
        </button>
      </div>
      {open ? (
        <div className="space-y-1 border-t border-white/10 px-4 py-3 lg:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/submit"
            onClick={close}
            className="block rounded-lg bg-amber-300 px-3 py-2 text-sm font-bold text-[#06122b]"
          >
            บันทึกการวิ่ง
          </Link>
          <button
            type="button"
            onClick={toggleAdmin}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-cyan-100 hover:bg-white/10"
          >
            โหมดแอดมิน{pending > 0 ? ` (${pending})` : ""}
          </button>
          {user ? (
            <Link href="/profile" onClick={close} className="block rounded-lg px-3 py-2 text-sm text-white/85">
              โปรไฟล์ · {user.name}
            </Link>
          ) : (
            <Link href="/login" onClick={close} className="block rounded-lg px-3 py-2 text-sm text-cyan-100">
              เข้าสู่ระบบ / ลงทะเบียน
            </Link>
          )}
        </div>
      ) : null}
    </header>
  );
}

function NavLink({ href, pathname, label }: { href: string; pathname: string; label: string }) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
        active ? "bg-amber-300 text-[#06122b]" : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function AdminSwitch({
  on,
  pending,
  onToggle,
}: {
  on: boolean;
  pending: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`ml-1 inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-bold tracking-wide ${
        on ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-100" : "border-white/15 text-white/70"
      }`}
    >
      <span className={`relative h-5 w-9 rounded-full ${on ? "bg-cyan-300" : "bg-white/20"}`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#06122b] transition ${on ? "left-4" : "left-0.5"}`}
        />
      </span>
      ADMIN
      {pending > 0 ? (
        <span className="rounded-full bg-rose-400 px-1.5 text-[10px] text-[#1a0508]">{pending}</span>
      ) : null}
    </button>
  );
}
