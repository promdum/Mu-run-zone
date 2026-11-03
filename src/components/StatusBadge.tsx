import type { RunStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: RunStatus }) {
  const verified = status === "verified";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${
        verified
          ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-200"
          : "border-amber-300 bg-amber-300 text-[#3a2a00]"
      }`}
    >
      {verified ? "Verified" : "⏳ รอตรวจสอบ (Pending)"}
    </span>
  );
}
