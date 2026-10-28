import { rankFromKm } from "./ranks";
import type { RankId } from "./types";

export const RANK_IMAGE_PATHS: Record<RankId, string> = {
  bronze: "/ranks/bronze.jpg",
  silver: "/ranks/silver.jpg",
  gold: "/ranks/gold.jpg",
  platinum: "/ranks/platinum.jpg",
  diamond: "/ranks/diamond.jpg",
  elite: "/ranks/elite.jpg",
  legend: "/ranks/legend.jpg",
};

export function rankImagePath(totalKm: number): string {
  const safeKm = Number.isFinite(totalKm) ? Math.max(0, totalKm) : 0;
  return RANK_IMAGE_PATHS[rankFromKm(safeKm).current.id];
}

export function rankImageById(rank: RankId): string {
  return RANK_IMAGE_PATHS[rank];
}
