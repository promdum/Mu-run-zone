import { json, liveRequest } from "@/lib/http";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  await liveRequest();
  await clearSessionCookie();
  return json({ ok: true });
}
