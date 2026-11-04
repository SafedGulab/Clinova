const pad = (n: number) => String(n).padStart(2, "0");

function tzOffsetMs(at: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** Local wall-clock time (date + minutes after midnight) in `tz` -> the real UTC instant. */
export function zonedToUtc(dateStr: string, minutes: number, tz: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  const first = guess - tzOffsetMs(new Date(guess), tz);
  return new Date(guess - tzOffsetMs(new Date(first), tz));
}

export function localDateString(at: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}

export function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const dayOfWeek = (dateStr: string) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();

export const formatTime = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);

export const formatDateTime = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: tz, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(d);

export function fmtMinutes(m: number) {
  const h = Math.floor(m / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m % 60)} ${h >= 12 ? "pm" : "am"}`;
}
