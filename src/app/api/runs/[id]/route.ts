import { calcPaceSec } from "@/lib/format";
import { json, liveRequest, refreshLivePages } from "@/lib/http";
import { detectFlags } from "@/lib/moderation";
import { findRun, removeRun, updateRun } from "@/lib/records";
import { toRunEntry } from "@/lib/run-record";
import { currentUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  await liveRequest();
  const user = await currentUser();
  if (!user || user.role !== "admin") return json({ error: "เฉพาะผู้ดูแลแก้ไขผลวิ่งได้" }, 403);
  const { id } = await params;
  const body = (await request.json()) as {
    distanceKm?: number;
    durationSec?: number;
    calories?: number;
    approve?: boolean;
  };
  const current = await findRun(id);
  if (!current) return json({ error: "ไม่พบรายการวิ่ง" }, 404);

  if (body.approve) {
    const saved = await updateRun(id, { status: "verified" });
    refreshLivePages();
    return json(toRunEntry(saved ?? current));
  }

  const distanceKm = Number(body.distanceKm);
  const durationSec = Math.round(Number(body.durationSec));
  const calories = Math.round(Number(body.calories));
  if (!distanceKm || distanceKm <= 0 || distanceKm > 999) {
    return json({ error: "ระยะทางต้องมากกว่า 0 และไม่เกิน 999 กิโลเมตร" }, 400);
  }
  if (!durationSec || durationSec <= 0 || durationSec > 48 * 3600) {
    return json({ error: "เวลารวมต้องมากกว่า 0 และไม่เกิน 48 ชั่วโมง" }, 400);
  }
  if (!Number.isFinite(calories) || calories < 0) return json({ error: "แคลอรี่ไม่ถูกต้อง" }, 400);
  const paceSecPerKm = calcPaceSec(distanceKm, durationSec);
  if (!paceSecPerKm) return json({ error: "คำนวณเพซไม่สำเร็จ" }, 400);
  const flags = detectFlags({ distanceKm, durationSec, paceSecPerKm, calories });
  const saved = await updateRun(id, {
    distanceKm,
    durationSec,
    calories,
    paceSecPerKm,
    flags,
    status: "pending",
  });
  refreshLivePages();
  return json(toRunEntry(saved ?? current));
}

export async function DELETE(_request: Request, { params }: Params) {
  await liveRequest();
  const user = await currentUser();
  if (!user || user.role !== "admin") return json({ error: "เฉพาะผู้ดูแลลบผลวิ่งได้" }, 403);
  const { id } = await params;
  await removeRun(id);
  refreshLivePages();
  return json({ ok: true });
}
