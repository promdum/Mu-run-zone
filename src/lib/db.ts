import { createAdminUser, ADMIN_MAHIDOL_ID, ADMIN_USER_ID } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const LOCAL_URL =
  "postgresql://postgres:postgres@127.0.0.1:54329/postgres?sslmode=disable&pgbouncer=true";
const LOCAL_PORT = 54329;

const globalDb = globalThis as unknown as {
  prisma?: PrismaClient;
  postgresReady?: Promise<void>;
  schemaReady?: Promise<void>;
};

function usesLocalPostgres() {
  const url = process.env.DATABASE_URL ?? "";
  return url.length === 0 || url.includes("127.0.0.1") || url.includes("localhost");
}

async function startLocalPostgres() {
  if (!usesLocalPostgres()) return;
  if (!process.env.DATABASE_URL) process.env.DATABASE_URL = LOCAL_URL;
  if (!globalDb.postgresReady) {
    globalDb.postgresReady = (async () => {
      const { PGlite } = await import("@electric-sql/pglite");
      const { PGLiteSocketServer } = await import("@electric-sql/pglite-socket");
      const dataDir = path.join(process.cwd(), "data", "pglite");
      await mkdir(dataDir, { recursive: true });
      const db = await PGlite.create(dataDir);
      const server = new PGLiteSocketServer({
        db,
        port: LOCAL_PORT,
        host: "127.0.0.1",
        maxConnections: 12,
      });
      try {
        await server.start();
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
        if (code !== "EADDRINUSE") throw error;
      }
    })().catch((error) => {
      globalDb.postgresReady = undefined;
      throw error;
    });
  }
  await globalDb.postgresReady;
}

async function ensureSchema(prisma: PrismaClient) {
  if (!globalDb.schemaReady) {
    globalDb.schemaReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          mahidol_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          faculty TEXT NOT NULL,
          team TEXT,
          role TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP(3) NOT NULL
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS runs (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          faculty TEXT NOT NULL,
          team TEXT,
          distance_km DOUBLE PRECISION NOT NULL,
          duration_sec INTEGER NOT NULL,
          pace_sec_per_km DOUBLE PRECISION,
          calories INTEGER NOT NULL,
          proof_image TEXT,
          created_at TIMESTAMP(3) NOT NULL,
          ran_at TIMESTAMP(3) NOT NULL,
          status TEXT NOT NULL,
          flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS runs_status_idx ON runs (status)`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS runs_user_id_idx ON runs (user_id)`);
    })().catch((error) => {
      globalDb.schemaReady = undefined;
      throw error;
    });
  }
  await globalDb.schemaReady;
}

async function ensureAdmin(prisma: PrismaClient) {
  const admin = await createAdminUser();
  const holder = await prisma.user.findUnique({ where: { mahidolId: ADMIN_MAHIDOL_ID } });
  if (holder && holder.id !== ADMIN_USER_ID) {
    await prisma.user.delete({ where: { id: holder.id } });
  }
  const current = await prisma.user.findUnique({ where: { id: ADMIN_USER_ID } });
  if (!current || current.mahidolId !== admin.mahidolId || current.passwordHash !== admin.passwordHash) {
    await prisma.user.upsert({
      where: { id: ADMIN_USER_ID },
      create: admin,
      update: {
        mahidolId: admin.mahidolId,
        name: admin.name,
        faculty: admin.faculty,
        role: admin.role,
        passwordHash: admin.passwordHash,
      },
    });
  }
}

export async function getPrisma() {
  await startLocalPostgres();
  if (!process.env.DATABASE_URL) process.env.DATABASE_URL = LOCAL_URL;
  if (!globalDb.prisma) {
    globalDb.prisma = new PrismaClient();
  }
  await ensureSchema(globalDb.prisma);
  await ensureAdmin(globalDb.prisma);
  return globalDb.prisma;
}
