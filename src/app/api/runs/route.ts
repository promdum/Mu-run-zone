import { FACULTIES } from "@/lib/faculties";
import { calcPaceSec } from "@/lib/format";
import { json, liveRequest } from "@/lib/http";
import { detectFlags } from "@/lib/moderation";
import { getPrisma } from "@/lib/db";
import { toRunEntry } from "@/lib/run-record";
import { currentUser } from "@/lib/session";

export async function GET() {
  await liveRequest();
  const prisma = await getPrisma();
  const runs = await prisma.run.findMany({ orderBy: { ranAt: "desc" } });
  return json(runs.map(toRunEntry));
}

export async function POST(request: Request) {
  await liveRequest();
  const user = await currentUser();
  if (!user) return json({ error: "เข้าสู่ระบบก่อนบันทึกผลวิ่ง" }, 401);

  const body = (await request.json()) as {
    id?: string;
    team?: string;
    distanceKm?: number;
    durationSec?: number;
    paceSecPerKm?: number;
    calories?: number;
    proofImage?: string;
    ranAt?: string;
  };

  const distanceKm = Number(body.distanceKm);
  const durationSec = Math.round(Number(body.durationSec));
  const calories = Math.round(Number(body.calories));
  const ranAt = new Date(body.ranAt ?? "");
  if (!distanceKm || distanceKm <= 0 || distanceKm > 999) {
    return json({ error: "ระยะทางต้องมากกว่า 0 และไม่เกิน 999 กิโลเมตร" }, 400);
  }
  if (!durationSec || durationSec <= 0 || durationSec > 48 * 3600) {
    return json({ error: "เวลารวมต้องมากกว่า 0 และไม่เกิน 48 ชั่วโมง" }, 400);
  }
  if (!Number.isFinite(calories) || calories < 0) return json({ error: "กรุณาใส่แคลอรี่" }, 400);
  if (!body.proofImage || !body.proofImage.startsWith("data:image/")) {
    return json({ error: "กรุณาแนบรูปหลักฐาน" }, 400);
  }
  if (body.proofImage.length > 900_000) return json({ error: "รูปหลักฐานใหญ่เกินไป" }, 400);
  if (Number.isNaN(ranAt.getTime())) return json({ error: "วันและเวลาที่วิ่งไม่ถูกต้อง" }, 400);
  if (ranAt.getTime() > Date.now() + 60_000) return json({ error: "วันและเวลาที่วิ่งต้องไม่เป็นอนาคต" }, 400);
  if (!FACULTIES.includes(user.faculty as (typeof FACULTIES)[number])) {
    return json({ error: "คณะในบัญชีไม่ถูกต้อง" }, 400);
  }

  const paceSecPerKm = calcPaceSec(distanceKm, durationSec);
  const suppliedPace = Number(body.paceSecPerKm);
  const pace = Number.isFinite(suppliedPace) && suppliedPace > 0 ? suppliedPace : paceSecPerKm;
  if (!pace) return json({ error: "คำนวณเพซไม่สำเร็จ" }, 400);
  const flags = detectFlags({ distanceKm, durationSec, paceSecPerKm: pace, calories });
  const team = body.team?.trim() || null;

  const prisma = await getPrisma();
  if (team && team !== user.team) {
    await prisma.user.update({ where: { id: user.id }, data: { team } });
  }
  const saved = await prisma.run.create({
    data: {
      id: body.id && /^[a-zA-Z0-9-]{8,80}$/.test(body.id) ? body.id : crypto.randomUUID(),
      userId: user.id,
      name: user.name,
      faculty: user.faculty,
      team,
      distanceKm,
      durationSec,
      paceSecPerKm: pace,
      calories,
      proofImage: body.proofImage,
      createdAt: new Date(),
      ranAt,
      status: "pending",
      flags,
    },
  });
  return json(toRunEntry(saved), 201);
}
