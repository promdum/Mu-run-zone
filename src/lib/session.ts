import { demoAccountById } from "@/lib/demo-auth";
import { isConnectionError, findUserById } from "@/lib/records";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
const COOKIE = "mu-runzone-session";

function secret() {
  return process.env.SESSION_SECRET || "mu-runzone-local-session";
}

export function signSession(userId: string) {
  const mac = createHmac("sha256", secret()).update(userId).digest("hex");
  return `${userId}.${mac}`;
}

export function readSessionUserId(token: string | undefined) {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(userId).digest("hex");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  return userId;
}

export async function currentUser() {
  const jar = await cookies();
  const userId = readSessionUserId(jar.get(COOKIE)?.value);
  if (!userId) return null;
  try {
    return await findUserById(userId);
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return demoAccountById(userId);
  }
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function publicUser(user: {
  id: string;
  mahidolId: string;
  name: string;
  faculty: string;
  team?: string | null;
  role: string;
  createdAt: Date | string;
}) {
  return {
    id: user.id,
    mahidolId: user.mahidolId,
    name: user.name,
    faculty: user.faculty,
    team: user.team ?? undefined,
    role: user.role === "admin" ? ("admin" as const) : ("member" as const),
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}
