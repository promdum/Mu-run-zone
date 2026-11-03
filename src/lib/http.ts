import { connection } from "next/server";
import { NextResponse } from "next/server";

export async function liveRequest() {
  await connection();
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    },
  });
}
