"use client";

import { calcPaceSec, formatPace, parseHms } from "@/lib/format";
import { detectFlags } from "@/lib/moderation";
import { compressImage } from "@/lib/storage";
import type { RunEntry } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useRuns } from "./RunsProvider";

function nowLocalInput() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function SubmitForm() {
  const router = useRouter();
  const { ready, user, submitRun } = useRuns();
  const [team, setTeam] = useState("");
  const [teamEdited, setTeamEdited] = useState(false);
  const [distance, setDistance] = useState("");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("0");
  const [pace, setPace] = useState("");
  const [calories, setCalories] = useState("");
  const [ranAt, setRanAt] = useState(nowLocalInput);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const teamValue = teamEdited ? team : (user?.team ?? "");

  const durationSec = parseHms(Number(hours) || 0, Number(minutes) || 0, Number(seconds) || 0);
  const km = Number(distance);
  const autoPace = useMemo(() => calcPaceSec(km, durationSec), [km, durationSec]);

  if (!ready) return <p className="text-white/60">กำลังเปิดฟอร์ม...</p>;
  if (!user) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-xl font-bold">เข้าสู่ระบบก่อนบันทึกผลวิ่ง</h2>
        <p className="mt-2 text-white/70">
          ใช้รหัสนักศึกษาหรือบุคลากรมหิดล เพื่อผูกชื่อและคณะกับบัญชี กันการย้ายระยะไปคณะอื่น
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login?next=/submit" className="rounded-full bg-amber-300 px-5 py-2.5 font-bold text-[#06122b]">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="rounded-full border border-white/20 px-5 py-2.5 font-semibold">
            ลงทะเบียน
          </Link>
        </div>
      </div>
    );
  }

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("กรุณาอัปโหลดเป็นไฟล์รูปภาพจากแอปวิ่ง");
      return;
    }
    setError("");
    setBusy(true);
    try {
      setPreview(await compressImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!user) return;
    if (!km || km <= 0 || km > 999) return setError("ระยะทางต้องมากกว่า 0 และไม่เกิน 999 กิโลเมตร");
    if (durationSec <= 0) return setError("กรุณาใส่เวลารวมของการวิ่ง");
    if ((Number(hours) || 0) > 48) return setError("เวลารวมต้องไม่เกิน 48 ชั่วโมง");
    if (calories.trim() === "" || Number(calories) < 0) return setError("กรุณาใส่แคลอรี่");
    if (!preview) return setError("กรุณาแนบรูปหลักฐานจากแอปวิ่ง เช่น Strava หรือสมาร์ทวอทช์");
    const when = new Date(ranAt);
    if (Number.isNaN(when.getTime())) return setError("วันและเวลาที่วิ่งไม่ถูกต้อง");
    if (when.getTime() > Date.now() + 60_000) return setError("วันและเวลาที่วิ่งต้องไม่เป็นอนาคต");

    let paceSec = autoPace;
    if (pace.trim()) {
      const [minuteText, secondText] = pace.split(/[:.]/);
      const minute = Number(minuteText);
      const second = secondText === undefined ? 0 : Number(secondText);
      if (!Number.isFinite(minute) || minute < 0 || !Number.isFinite(second) || second < 0 || second >= 60) {
        return setError("เพซต้องเป็นรูปแบบ นาที:วินาที เช่น 6:20");
      }
      paceSec = minute * 60 + second;
    }
    if (!paceSec) return setError("คำนวณเพซไม่สำเร็จ");

    const flags = detectFlags({
      distanceKm: km,
      durationSec,
      paceSecPerKm: paceSec,
      calories: Number(calories),
    });
    const entry: RunEntry = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: user.name,
      faculty: user.faculty,
      team: teamValue.trim() || undefined,
      distanceKm: km,
      durationSec,
      paceSecPerKm: paceSec,
      calories: Math.round(Number(calories)),
      proofImage: preview,
      createdAt: new Date().toISOString(),
      ranAt: when.toISOString(),
      status: "pending",
      flags,
    };

    setBusy(true);
    try {
      await submitRun(entry);
      router.push(`/runfeed?posted=${entry.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-cyan-300/15 bg-white/5 p-6 shadow-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อ-นามสกุล">
          <input value={user.name} readOnly className="input opacity-80" />
        </Field>
        <Field label="คณะ / หน่วยงาน">
          <input value={user.faculty} readOnly className="input opacity-80" />
        </Field>
      </div>
      <p className="text-xs text-white/45">ชื่อและคณะมาจากบัญชี {user.mahidolId} เพื่อไม่ให้ส่งผลในนามคณะอื่น</p>

      <Field label="ทีม (ถ้ามี)">
        <input
          value={teamValue}
          onChange={(event) => {
            setTeamEdited(true);
            setTeam(event.target.value);
          }}
          className="input"
          placeholder="ชมรม รุ่น หรือทีมวิ่ง"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ระยะทาง (กิโลเมตร)">
          <input
            required
            type="number"
            min="0.1"
            max="999"
            step="0.01"
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
            className="input"
            placeholder="5.00"
          />
        </Field>
        <Field label="แคลอรี่">
          <input
            required
            type="number"
            min="0"
            step="1"
            value={calories}
            onChange={(event) => setCalories(event.target.value)}
            className="input"
            placeholder="320"
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-white/80">เวลาที่ใช้</legend>
        <div className="grid grid-cols-3 gap-2">
          <TimeBox label="ชม." value={hours} onChange={setHours} />
          <TimeBox label="นาที" value={minutes} onChange={setMinutes} />
          <TimeBox label="วินาที" value={seconds} onChange={setSeconds} />
        </div>
      </fieldset>

      <Field label="เพซ (ไม่บังคับ)">
        <input
          value={pace}
          onChange={(event) => setPace(event.target.value)}
          className="input"
          placeholder="เช่น 6:20 — ถ้าไม่ใส่ ระบบจะคำนวณให้อัตโนมัติ"
        />
        {autoPace ? (
          <p className="mt-2 text-xs text-amber-200/80">เพซจากระยะทางและเวลา: {formatPace(autoPace)}</p>
        ) : null}
      </Field>

      <Field label="วันที่และเวลาที่วิ่ง">
        <input
          required
          type="datetime-local"
          value={ranAt}
          onChange={(event) => setRanAt(event.target.value)}
          className="input"
        />
      </Field>

      <Field label="รูปหลักฐานการวิ่ง (Strava / Garmin / Samsung Health / Apple Fitness)">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300/40 bg-black/20 px-4 py-8 text-center hover:border-amber-300">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
          <span className="text-sm text-white/80">
            {busy ? "กำลังย่อรูป..." : "แตะเพื่ออัปโหลดสกรีนช็อตสรุปการวิ่ง"}
          </span>
        </label>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="หลักฐานการวิ่งที่กำลังจะส่ง" className="mt-3 max-h-64 w-full rounded-2xl object-cover" />
        ) : null}
      </Field>

      {error ? <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 py-3 font-bold text-[#06122b] shadow-[0_10px_40px_rgba(245,197,66,0.25)] disabled:opacity-60"
      >
        ส่งผลวิ่งให้ผู้ดูแลตรวจสอบ
      </button>
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

function TimeBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input text-center"
        aria-label={label}
      />
      <p className="mt-1 text-center text-[11px] text-white/45">{label}</p>
    </div>
  );
}
