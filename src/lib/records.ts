import { getPrisma } from "@/lib/db";
import { memoryDb, type MemoryRun, type MemoryUser } from "@/lib/memory-store";
import type { PrismaClient } from "@prisma/client";

const gate = globalThis as unknown as { muDbDown?: boolean };

function isConnectionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  if (name === "PrismaClientInitializationError") return true;
  if (code === "P1000" || code === "P1001" || code === "P1002" || code === "P1017") return true;
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Can't reach database|Connection refused|password authentication failed|getaddrinfo|PGlite|ENOENT|EROFS|EACCES|DATABASE_URL/i.test(
    message,
  );
}

function databaseUnavailable() {
  if (gate.muDbDown) return true;
  if (process.env.VERCEL) {
    const url = process.env.DATABASE_URL?.trim() ?? "";
    if (!url || /127\.0\.0\.1|localhost/i.test(url)) {
      gate.muDbDown = true;
      return true;
    }
  }
  return false;
}

async function readFromPrisma<T>(action: (prisma: PrismaClient) => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (databaseUnavailable()) return fallback();
  try {
    const prisma = await getPrisma();
    return await action(prisma);
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    gate.muDbDown = true;
    return fallback();
  }
}

export async function listRuns(): Promise<MemoryRun[]> {
  return readFromPrisma(
    async (prisma) => prisma.run.findMany({ orderBy: { ranAt: "desc" } }),
    async () => {
      const db = await memoryDb();
      return [...db.runs].sort((a, b) => b.ranAt.getTime() - a.ranAt.getTime());
    },
  );
}

export async function listVerifiedRuns(): Promise<MemoryRun[]> {
  return readFromPrisma(
    async (prisma) => prisma.run.findMany({ where: { status: "verified" } }),
    async () => {
      const db = await memoryDb();
      return db.runs.filter((run) => run.status === "verified");
    },
  );
}

export async function findRun(id: string) {
  return readFromPrisma(
    async (prisma) => prisma.run.findUnique({ where: { id } }),
    async () => {
      const db = await memoryDb();
      return db.runs.find((run) => run.id === id) ?? null;
    },
  );
}

export async function createRun(data: MemoryRun) {
  return readFromPrisma(
    async (prisma) => prisma.run.create({ data }),
    async () => {
      const db = await memoryDb();
      db.runs.unshift(data);
      return data;
    },
  );
}

export async function updateRun(
  id: string,
  data: {
    status?: string;
    distanceKm?: number;
    durationSec?: number;
    calories?: number;
    paceSecPerKm?: number | null;
    flags?: string[];
  },
) {
  return readFromPrisma(
    async (prisma) =>
      prisma.run.update({
        where: { id },
        data: {
          status: data.status,
          distanceKm: data.distanceKm,
          durationSec: data.durationSec,
          calories: data.calories,
          paceSecPerKm: data.paceSecPerKm,
          flags: data.flags ? { set: data.flags } : undefined,
        },
      }),
    async () => {
      const db = await memoryDb();
      const current = db.runs.find((run) => run.id === id);
      if (!current) return null;
      if (data.status !== undefined) current.status = data.status;
      if (data.distanceKm !== undefined) current.distanceKm = data.distanceKm;
      if (data.durationSec !== undefined) current.durationSec = data.durationSec;
      if (data.calories !== undefined) current.calories = data.calories;
      if (data.paceSecPerKm !== undefined) current.paceSecPerKm = data.paceSecPerKm;
      if (data.flags !== undefined) current.flags = data.flags;
      return current;
    },
  );
}

export async function approveCleanRuns() {
  return readFromPrisma(
    async (prisma) => {
      const result = await prisma.run.updateMany({
        where: { status: "pending", flags: { isEmpty: true } },
        data: { status: "verified" },
      });
      return result.count;
    },
    async () => {
      const db = await memoryDb();
      let count = 0;
      for (const run of db.runs) {
        if (run.status === "pending" && run.flags.length === 0) {
          run.status = "verified";
          count += 1;
        }
      }
      return count;
    },
  );
}

export async function removeRun(id: string) {
  await readFromPrisma(
    async (prisma) => {
      await prisma.run.delete({ where: { id } }).catch(() => null);
    },
    async () => {
      const db = await memoryDb();
      db.runs = db.runs.filter((run) => run.id !== id);
    },
  );
}

export async function findUserById(id: string) {
  return readFromPrisma(
    async (prisma) => prisma.user.findUnique({ where: { id } }),
    async () => {
      const db = await memoryDb();
      return db.users.find((user) => user.id === id) ?? null;
    },
  );
}

export async function findUserByMahidolId(mahidolId: string) {
  return readFromPrisma(
    async (prisma) => prisma.user.findUnique({ where: { mahidolId } }),
    async () => {
      const db = await memoryDb();
      return db.users.find((user) => user.mahidolId === mahidolId) ?? null;
    },
  );
}

export async function createUser(data: MemoryUser) {
  return readFromPrisma(
    async (prisma) =>
      prisma.user.create({
        data,
      }),
    async () => {
      const db = await memoryDb();
      db.users.push(data);
      return data;
    },
  );
}

export async function updateUserTeam(id: string, team: string) {
  await readFromPrisma(
    async (prisma) => {
      await prisma.user.update({ where: { id }, data: { team } });
    },
    async () => {
      const db = await memoryDb();
      const user = db.users.find((item) => item.id === id);
      if (user) user.team = team;
    },
  );
}
