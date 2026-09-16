import type { Meeting, Task } from "./types";

export const DOW = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export const MON = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const pad = (n: number) => String(n).padStart(2, "0");

export const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const today = () => ymd(new Date());

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(s: string): string {
  if (!s) return "";
  const d = parseYmd(s);
  return `${d.getDate()} ${MON[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function dayDiff(s: string): number {
  return Math.round((parseYmd(s).getTime() - parseYmd(today()).getTime()) / 86400000);
}

/** Label + kelas untuk pil tanggal jatuh tempo. */
export function dueInfo(s: string): { text: string; cls: string } | null {
  if (!s) return null;
  const d = dayDiff(s);
  const cls = d < 0 ? "overdue" : d <= 1 ? "due-soon" : "";
  const text =
    d === 0 ? "Hari ini"
    : d === 1 ? "Besok"
    : d === -1 ? "Telat 1 hari"
    : d < 0 ? `Telat ${-d} hari`
    : fmtDate(s);
  return { text, cls };
}

export function subProgress(t: Task) {
  const subs = t.subtasks || [];
  if (!subs.length) return null;
  const done = subs.filter((s) => s.done).length;
  return { done, total: subs.length, pct: Math.round((done / subs.length) * 100) };
}

/** Ambil ID video dari berbagai bentuk tautan YouTube. */
export function ytId(input: string): string | null {
  const s = (input || "").trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Tautan "tambah acara" Google Calendar, pengganti OAuth di versi sederhana. */
export function gcalLink(m: Meeting): string {
  const date = m.date.replace(/-/g, "");
  const t = (v: string) => v.replace(":", "") + "00";
  const details = [m.desc, m.url ? `Tautan: ${m.url}` : ""].filter(Boolean).join("\n\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: m.title,
    dates: `${date}T${t(m.start)}/${date}T${t(m.end)}`,
    details,
    location: m.url || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function greeting(hour: number): string {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}