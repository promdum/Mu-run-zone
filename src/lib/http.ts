import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { NextResponse } from "next/server";

export async function liveRequest() {
  await connection();
}

export function refreshLivePages() {
  revalidatePath("/", "layout");
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
