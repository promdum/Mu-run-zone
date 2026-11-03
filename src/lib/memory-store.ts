import { createAdminUser } from "@/lib/auth";

export type MemoryUser = {
  id: string;
  mahidolId: string;
  name: string;
  faculty: string;
  team: string | null;
  role: string;
  passwordHash: string;
  createdAt: Date;
};

export type MemoryRun = {
  id: string;
  userId: string | null;
  name: string;
  faculty: string;
  team: string | null;
  distanceKm: number;
  durationSec: number;
  paceSecPerKm: number | null;
  calories: number;
  proofImage: string | null;
  createdAt: Date;
  ranAt: Date;
  status: string;
  flags: string[];
};

type MemoryDb = {
  users: MemoryUser[];
  runs: MemoryRun[];
};

const globalMemory = globalThis as unknown as { muRunMemory?: MemoryDb };

export async function memoryDb() {
  if (!globalMemory.muRunMemory) {
    const admin = await createAdminUser();
    globalMemory.muRunMemory = {
      users: [
        {
          id: admin.id,
          mahidolId: admin.mahidolId,
          name: admin.name,
          faculty: admin.faculty,
          team: admin.team ?? null,
          role: admin.role,
          passwordHash: admin.passwordHash,
          createdAt: new Date(admin.createdAt),
        },
      ],
      runs: [],
    };
  }
  return globalMemory.muRunMemory;
}
