"use client";

import { ADMIN_MAHIDOL_ID, ADMIN_PASSWORD } from "@/lib/auth";
import { FACULTIES } from "@/lib/faculties";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useRuns } from "./RunsProvider";

export function LoginForm({ adminOnly = false }: { adminOnly?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = adminOnly ? "/admin" : params.get("next") || "/profile";
  const { ready, login, logout } = useRuns();
  const [mahidolId, setMahidolId] = useState(adminOnly ? ADMIN_MAHIDOL_ID : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await login(mahidolId, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (adminOnly && result.user.role !== "admin") {
      logout();
      setError("บัญชีนี้ไม่ใช่ผู้ดูแลระบบ");
      return;
    }
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
    router.push(safeNext);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-cyan-300/15 bg-white/5 p-6">
      <Field label="รหัสนักศึกษา / บุคลากรมหิดล">
        <input
          required
          value={mahidolId}
          onChange={(event) => setMahidolId(event.target.value)}
          className="input"
          autoComplete="username"
          placeholder="เช่น 6538123"
        />
      </Field>
      <Field label="รหัสผ่าน">
        <input
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input"
          autoComplete="current-password"
        />
      </Field>
      {error ? <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
      <button
        type="submit"
        disabled={!ready || busy}
        className="w-full rounded-full bg-amber-300 py-3 font-bold text-[#06122b] disabled:opacity-60"
      >
        {busy ? "กำลังตรวจสอบ..." : adminOnly ? "เข้าสู่โหมดแอดมิน" : "เข้าสู่ระบบ"}
      </button>
      {adminOnly ? (
        <p className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-xs leading-relaxed text-white/60">
          บัญชีผู้ดูแลของระบบนี้คือรหัส {ADMIN_MAHIDOL_ID} รหัสผ่าน {ADMIN_PASSWORD} ข้อมูลทั้งหมดอยู่บนเบราว์เซอร์เครื่องนี้
        </p>
      ) : (
        <p className="text-sm text-white/60">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-amber-300 hover:underline">
            ลงทะเบียน
          </Link>
        </p>
      )}
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { ready, register } = useRuns();
  const [mahidolId, setMahidolId] = useState("");
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState<string>(FACULTIES[0]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setBusy(true);
    const result = await register({ mahidolId, password, name, faculty });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/profile");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-cyan-300/15 bg-white/5 p-6">
      <Field label="รหัสนักศึกษา / บุคลากรมหิดล">
        <input
          required
          value={mahidolId}
          onChange={(event) => setMahidolId(event.target.value)}
          className="input"
          autoComplete="username"
          placeholder="ตัวเลขหรือตัวอักษร 5–13 หลัก"
        />
      </Field>
      <Field label="ชื่อ-นามสกุล">
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="input"
          autoComplete="name"
          placeholder="ชื่อที่จะแสดงบน Runfeed และลีดเดอร์บอร์ด"
        />
      </Field>
      <Field label="คณะ / หน่วยงาน">
        <select value={faculty} onChange={(event) => setFaculty(event.target.value)} className="input">
          {FACULTIES.map((item) => (
            <option key={item} value={item} className="text-black">
              {item}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="รหัสผ่าน">
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            autoComplete="new-password"
          />
        </Field>
        <Field label="ยืนยันรหัสผ่าน">
          <input
            required
            type="password"
            minLength={6}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="input"
            autoComplete="new-password"
          />
        </Field>
      </div>
      {error ? <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
      <button
        type="submit"
        disabled={!ready || busy}
        className="w-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 py-3 font-bold text-[#06122b] disabled:opacity-60"
      >
        {busy ? "กำลังสร้างบัญชี..." : "สร้างบัญชี MU RUN ZONE"}
      </button>
      <p className="text-sm text-white/60">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="text-amber-300 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/80">{label}</span>
      {children}
    </label>
  );
}
