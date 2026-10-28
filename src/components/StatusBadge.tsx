import type { RunStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: RunStatus }) {
  const verified = status === "verified";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${
        verified
          ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-200"
          : "border-amber-300/50 bg-amber-300/15 text-amber-100"
      }`}
    >
      {verified ? "Verified" : "Pending"}
    </span>
  );
}
