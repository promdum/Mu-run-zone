import { getRank } from "@/lib/ranks";
import type { RankId } from "@/lib/types";

export function RankBadge({
  rank,
  size = "md",
}: {
  rank: RankId;
  size?: "sm" | "md" | "lg";
}) {
  const info = getRank(rank);
  const pad =
    size === "lg" ? "px-4 py-2 text-sm" : size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold tracking-wide ${pad}`}
      style={{
        color: info.color,
        borderColor: info.color,
        background: `linear-gradient(180deg, ${info.glow}, transparent)`,
        boxShadow: `0 0 18px ${info.glow}`,
      }}
      title={`${info.nameEn} · ${info.motto}`}
    >
      <svg viewBox="0 0 32 36" className={size === "lg" ? "h-6 w-5" : "h-4 w-3.5"} aria-hidden>
        <path
          d="M16 1.5 29 6.2v10.2C29 26.2 16 34.5 16 34.5S3 26.2 3 16.4V6.2L16 1.5Z"
          fill={info.color}
        />
        <path
          d="M16 7.2 23 10v6.2c0 4.2-7 8.6-7 8.6s-7-4.4-7-8.6V10l7-2.8Z"
          fill="#07101f"
          opacity="0.55"
        />
      </svg>
      {size === "sm" ? (
        info.nameTh
      ) : (
        <span className="leading-tight">
          <span className="block uppercase">{info.nameEn}</span>
          <span className="block text-[10px] font-medium opacity-80">{info.nameTh}</span>
        </span>
      )}
    </span>
  );
}
