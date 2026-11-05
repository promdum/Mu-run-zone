import { hashPassword, mahidolIdError, normalizeMahidolId } from "@/lib/auth";
import { demoAccountByMahidolId } from "@/lib/demo-auth";
import { json, liveRequest } from "@/lib/http";
import { findUserByMahidolId, isConnectionError } from "@/lib/records";
import { publicUser, setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  await liveRequest();
  const body = (await request.json()) as { mahidolId?: string; password?: string };
  const mahidolId = normalizeMahidolId(body.mahidolId ?? "");
  const idError = mahidolIdError(mahidolId);
  if (idError) return json({ error: idError }, 400);
  if (!body.password) return json({ error: "กรุณาใส่รหัสผ่าน" }, 400);
  let account;
  try {
    account = await findUserByMahidolId(mahidolId);
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    account = await demoAccountByMahidolId(mahidolId);
  }
  if (!account) return json({ error: "ไม่พบบัญชีจากรหัสนี้" }, 401);
  const hash = await hashPassword(body.password, account.mahidolId);
  if (hash !== account.passwordHash) return json({ error: "รหัสผ่านไม่ถูกต้อง" }, 401);
  await setSessionCookie(account.id);
  return json({ user: publicUser(account) });
}
