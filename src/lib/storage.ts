import { ADMIN_MAHIDOL_ID, ADMIN_USER_ID, createAdminUser, SESSION_KEY } from "./auth";
import type { RunEntry, UserAccount } from "./types";

const DATA_VERSION = "2026-10-29-live";

function isMockRunId(id: string) {
  return id.startsWith("seed-") || id.startsWith("flag-") || id.startsWith("pending-");
}

const DB_NAME = "mu-runzone";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function req<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"));
  });
}

function openDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("เบราว์เซอร์นี้ไม่รองรับ IndexedDB"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("runs")) db.createObjectStore("runs", { keyPath: "id" });
        if (!db.objectStoreNames.contains("users")) {
          const users = db.createObjectStore("users", { keyPath: "id" });
          users.createIndex("mahidolId", "mahidolId", { unique: true });
        }
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

async function readMeta(db: IDBDatabase, key: string) {
  const tx = db.transaction("meta", "readonly");
  const value = await req(tx.objectStore("meta").get(key));
  await txDone(tx);
  return typeof value === "string" ? value : null;
}

async function writeMeta(db: IDBDatabase, key: string, value: string) {
  const tx = db.transaction("meta", "readwrite");
  tx.objectStore("meta").put(value, key);
  await txDone(tx);
}

async function readAllRuns(db: IDBDatabase) {
  const tx = db.transaction("runs", "readonly");
  const rows = (await req(tx.objectStore("runs").getAll())) as RunEntry[];
  await txDone(tx);
  return rows.map(normalizeRun);
}

async function replaceRuns(db: IDBDatabase, runs: RunEntry[]) {
  const tx = db.transaction("runs", "readwrite");
  const store = tx.objectStore("runs");
  store.clear();
  for (const run of runs) store.put(normalizeRun(run));
  await txDone(tx);
}

export function normalizeRun(run: RunEntry): RunEntry {
  const pace =
    run.paceSecPerKm && run.paceSecPerKm > 0
      ? run.paceSecPerKm
      : run.distanceKm > 0
        ? run.durationSec / run.distanceKm
        : undefined;
  return {
    ...run,
    paceSecPerKm: pace,
    ranAt: run.ranAt || run.createdAt,
    status: run.status === "pending" ? "pending" : "verified",
    flags: Array.isArray(run.flags) ? run.flags : [],
  };
}

let bootPromise: ReturnType<typeof loadStore> | null = null;

export function bootstrapStore() {
  if (!bootPromise) {
    bootPromise = loadStore().catch((error) => {
      bootPromise = null;
      throw error;
    });
  }
  return bootPromise;
}

async function loadStore() {
  const db = await openDb();
  const version = await readMeta(db, "seedVersion");
  if (version !== DATA_VERSION) {
    const existing = await readAllRuns(db);
    const kept = existing.filter((run) => !isMockRunId(run.id));
    await replaceRuns(db, kept);
    await writeMeta(db, "seedVersion", DATA_VERSION);
  }
  await ensureAdmin();

  const runs = await readAllRuns(db);
  const sessionId = typeof window === "undefined" ? null : localStorage.getItem(SESSION_KEY);
  const user = sessionId ? await getUser(sessionId) : null;
  if (sessionId && !user) localStorage.removeItem(SESSION_KEY);
  return { runs, user };
}

export async function putRun(run: RunEntry) {
  const db = await openDb();
  const tx = db.transaction("runs", "readwrite");
  tx.objectStore("runs").put(normalizeRun(run));
  await txDone(tx);
}

export async function removeRun(id: string) {
  const db = await openDb();
  const tx = db.transaction("runs", "readwrite");
  tx.objectStore("runs").delete(id);
  await txDone(tx);
}

export async function getUser(id: string) {
  const db = await openDb();
  const tx = db.transaction("users", "readonly");
  const user = (await req(tx.objectStore("users").get(id))) as UserAccount | undefined;
  await txDone(tx);
  return user ?? null;
}

export async function findUserByMahidolId(mahidolId: string) {
  const db = await openDb();
  const tx = db.transaction("users", "readonly");
  const user = (await req(tx.objectStore("users").index("mahidolId").get(mahidolId))) as
    | UserAccount
    | undefined;
  await txDone(tx);
  return user ?? null;
}

async function removeUser(id: string) {
  const db = await openDb();
  const tx = db.transaction("users", "readwrite");
  tx.objectStore("users").delete(id);
  await txDone(tx);
}

async function ensureAdmin() {
  const holder = await findUserByMahidolId(ADMIN_MAHIDOL_ID);
  if (holder && holder.id !== ADMIN_USER_ID) await removeUser(holder.id);
  const admin = await createAdminUser();
  const current = await getUser(ADMIN_USER_ID);
  if (!current || current.mahidolId !== admin.mahidolId || current.passwordHash !== admin.passwordHash) {
    await putUser(admin);
  }
}

export async function putUser(user: UserAccount) {
  const db = await openDb();
  const tx = db.transaction("users", "readwrite");
  tx.objectStore("users").put(user);
  await txDone(tx);
}

export function readSessionId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function writeSessionId(userId: string | null) {
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
}

export function compressImage(file: File, maxBytes = 520_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("ย่อรูปไม่สำเร็จ"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let quality = 0.82;
        let data = canvas.toDataURL("image/jpeg", quality);
        while (data.length > maxBytes && quality > 0.4) {
          quality -= 0.12;
          data = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(data);
      };
      img.onerror = () => reject(new Error("ไฟล์รูปไม่ถูกต้อง"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
