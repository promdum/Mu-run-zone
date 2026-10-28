import type { UserAccount } from "./types";

export const ADMIN_USER_ID = "user-admin";
export const ADMIN_MAHIDOL_ID = "6913084";
export const ADMIN_PASSWORD = "SalayaAdmin";
export const SESSION_KEY = "mu-runzone-session-v1";

export function normalizeMahidolId(value: string) {
  return value.trim().toUpperCase();
}

export function mahidolIdError(value: string) {
  const id = normalizeMahidolId(value);
  if (!/^[A-Z0-9]{5,13}$/.test(id)) {
    return "รหัสนักศึกษาหรือบุคลากรต้องเป็นตัวเลขหรือตัวอักษร 5–13 หลัก";
  }
  return "";
}

export async function hashPassword(password: string, mahidolId: string) {
  const data = new TextEncoder().encode(`mu-runzone:${normalizeMahidolId(mahidolId)}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createAdminUser(): Promise<UserAccount> {
  return {
    id: ADMIN_USER_ID,
    mahidolId: ADMIN_MAHIDOL_ID,
    name: "ผู้ดูแลระบบ MU RUN ZONE",
    faculty: "บุคลากรมหาวิทยาลัย",
    role: "admin",
    passwordHash: await hashPassword(ADMIN_PASSWORD, ADMIN_MAHIDOL_ID),
    createdAt: "2026-01-01T02:00:00.000Z",
  };
}
