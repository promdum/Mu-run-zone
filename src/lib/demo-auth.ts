import { createAdminUser } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/mockData";
import type { UserAccount } from "@/lib/types";

export async function demoAccountByMahidolId(mahidolId: string): Promise<UserAccount | null> {
  if (!DEMO_MODE) return null;
  const admin = await createAdminUser();
  return admin.mahidolId === mahidolId ? admin : null;
}

export async function demoAccountById(id: string): Promise<UserAccount | null> {
  if (!DEMO_MODE) return null;
  const admin = await createAdminUser();
  return admin.id === id ? admin : null;
}
