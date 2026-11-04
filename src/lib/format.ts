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

export function formatCount(value: number) {
  const rounded = Math.round(value);
  const negative = rounded < 0;
  const grouped = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return negative ? `-${grouped}` : grouped;
}

export function formatKm(km: number) {
  const rounded = Math.round(km * 10) / 10;
  const negative = rounded < 0;
  const [whole, fraction] = Math.abs(rounded).toFixed(1).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const text = fraction === "0" ? grouped : `${grouped}.${fraction}`;
  return `${negative ? "-" : ""}${text} กม.`;
}

export function calcPaceSec(distanceKm: number, durationSec: number) {
  if (distanceKm <= 0 || durationSec <= 0) return undefined;
  return durationSec / distanceKm;
}

export function parseHms(hours: number, minutes: number, seconds: number) {
  return hours * 3600 + minutes * 60 + seconds;
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const bangkok = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const day = bangkok.getUTCDate();
  const month = THAI_MONTHS[bangkok.getUTCMonth()];
  const year = bangkok.getUTCFullYear() + 543;
  const hour = String(bangkok.getUTCHours()).padStart(2, "0");
  const minute = String(bangkok.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} ${hour}:${minute}`;
}
