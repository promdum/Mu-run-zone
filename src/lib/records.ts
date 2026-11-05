import { getPrisma, resetPrisma } from "@/lib/db";
import type { MemoryRun, MemoryUser } from "@/lib/memory-store";
import type { PrismaClient } from "@prisma/client";

export function isConnectionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  if (name === "PrismaClientInitializationError") return true;
  if (code === "P1000" || code === "P1001" || code === "P1002" || code === "P1017") return true;
  return /ECONNRESET|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Can't reach database|Connection refused|Connection terminated|closed the connection|Idle timeout|password authentication failed|getaddrinfo|PGlite|ENOENT|EROFS|EACCES/i.test(
    message,
  );
}

async function withPrisma<T>(action: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await action(await getPrisma());
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    await resetPrisma();
    return action(await getPrisma());
  }
}

export async function listRuns(): Promise<MemoryRun[]> {
  return withPrisma((prisma) => prisma.run.findMany({ orderBy: { ranAt: "desc" } }));
}

export async function listVerifiedRuns(): Promise<MemoryRun[]> {
  return withPrisma((prisma) => prisma.run.findMany({ where: { status: "verified" } }));
}

export async function findRun(id: string) {
  return withPrisma((prisma) => prisma.run.findUnique({ where: { id } }));
}

export async function createRun(data: MemoryRun) {
  return withPrisma((prisma) => prisma.run.create({ data }));
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
  return withPrisma((prisma) =>
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
  );
}

export async function approveCleanRuns() {
  return withPrisma(async (prisma) => {
    const result = await prisma.run.updateMany({
      where: { status: "pending", flags: { isEmpty: true } },
      data: { status: "verified" },
    });
    return result.count;
  });
}

export async function removeRun(id: string) {
  await withPrisma(async (prisma) => {
    await prisma.run.delete({ where: { id } }).catch(() => null);
  });
}

export async function findUserById(id: string) {
  return withPrisma((prisma) => prisma.user.findUnique({ where: { id } }));
}

export async function findUserByMahidolId(mahidolId: string) {
  return withPrisma((prisma) => prisma.user.findUnique({ where: { mahidolId } }));
}

export async function createUser(data: MemoryUser) {
  return withPrisma((prisma) => prisma.user.create({ data }));
}

export async function updateUserTeam(id: string, team: string) {
  await withPrisma((prisma) => prisma.user.update({ where: { id }, data: { team } }));
}
