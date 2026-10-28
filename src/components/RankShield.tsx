import { rankImageById, rankImagePath } from "@/lib/rankImage";
import { getRank, rankFromKm } from "@/lib/ranks";
import type { RankId } from "@/lib/types";

const SIZE_CLASS = {
  sm: "w-20",
  md: "w-32",
  lg: "w-44",
  xl: "w-56",
} as const;

export function RankShield({
  totalKm,
  rank,
  size = "md",
  priority = false,
}: {
  totalKm?: number;
  rank?: RankId;
  size?: keyof typeof SIZE_CLASS;
  priority?: boolean;
}) {
  const rankId = rank ?? rankFromKm(totalKm ?? 0).current.id;
  const info = getRank(rankId);
  const src = rank ? rankImageById(rank) : rankImagePath(totalKm ?? 0);

  return (
    <span
      className={`rank-aura inline-flex shrink-0 ${SIZE_CLASS[size]}`}
      style={{ ["--rank-glow" as string]: info.glow }}
      title={`${info.nameEn} · ${info.nameTh}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`โล่แรงค์ ${info.nameTh} ของมหิดล`}
        width={512}
        height={512}
        className="rank-shield-img"
        fetchPriority={priority ? "high" : "auto"}
      />
    </span>
  );
}
