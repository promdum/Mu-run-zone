import { ADMIN_MAHIDOL_ID, hashPassword, mahidolIdError, normalizeMahidolId } from "@/lib/auth";
import { FACULTIES } from "@/lib/faculties";
import { getPrisma } from "@/lib/db";
import { json, liveRequest } from "@/lib/http";
import { publicUser, setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  await liveRequest();
  const body = (await request.json()) as {
    mahidolId?: string;
    password?: string;
    name?: string;
    faculty?: string;
  };
  const mahidolId = normalizeMahidolId(body.mahidolId ?? "");
  const idError = mahidolIdError(mahidolId);
  if (idError) return json({ error: idError }, 400);
  if (mahidolId === ADMIN_MAHIDOL_ID) return json({ error: "รหัสนี้สงวนไว้สำหรับผู้ดูแลระบบ" }, 400);
  const name = (body.name ?? "").trim();
  if (name.length < 2) return json({ error: "กรุณาใส่ชื่อ-นามสกุล" }, 400);
  if (!body.faculty || !FACULTIES.includes(body.faculty as (typeof FACULTIES)[number])) {
    return json({ error: "กรุณาเลือกคณะหรือหน่วยงาน" }, 400);
  }
  if (!body.password || body.password.length < 6) {
    return json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, 400);
  }
  const prisma = await getPrisma();
  const existing = await prisma.user.findUnique({ where: { mahidolId } });
  if (existing) return json({ error: "รหัสนี้ลงทะเบียนแล้ว ลองเข้าสู่ระบบ" }, 409);
  const account = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      mahidolId,
      name,
      faculty: body.faculty,
      role: "member",
      passwordHash: await hashPassword(body.password, mahidolId),
      createdAt: new Date(),
    },
  });
  await setSessionCookie(account.id);
  return json({ user: publicUser(account) }, 201);
}
