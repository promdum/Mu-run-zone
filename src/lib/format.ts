export function formatDuration(totalSec: number) {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function splitDuration(totalSec: number) {
  const sec = Math.max(0, Math.round(totalSec));
  return {
    hours: Math.floor(sec / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
  };
}

export function formatPace(secPerKm?: number) {
  if (!secPerKm || !Number.isFinite(secPerKm) || secPerKm <= 0) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /กม.`;
}

export function formatKm(km: number) {
  const rounded = Math.round(km * 10) / 10;
  return `${rounded.toLocaleString("th-TH", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
  })} กม.`;
}

export function calcPaceSec(distanceKm: number, durationSec: number) {
  if (distanceKm <= 0 || durationSec <= 0) return undefined;
  return durationSec / distanceKm;
}

export function parseHms(hours: number, minutes: number, seconds: number) {
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
