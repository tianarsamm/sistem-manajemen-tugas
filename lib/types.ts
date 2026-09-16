export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type Platform = "GOOGLE_MEET" | "ZOOM" | "TEAMS" | "OTHER";

export interface Subtask {
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  status: TaskStatus;
  priority: Priority;
  due: string; // YYYY-MM-DD, "" kalau tanpa tenggat
  category: string;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  due: string;
  category: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  desc: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  platform: Platform;
  url: string;
  reminder: number; // menit sebelum
  gcalId: string | null;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: string;
}

export interface MusicItem {
  id: string;
  playlistId: string;
  videoId: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface AppData {
  tasks: Task[];
  todos: Todo[];
  meetings: Meeting[];
  playlists: Playlist[];
  music: MusicItem[];
}

export type Collection = keyof AppData;

export const PRIORITIES: [Priority, string][] = [
  ["LOW", "Rendah"],
  ["MEDIUM", "Sedang"],
  ["HIGH", "Tinggi"],
  ["URGENT", "Mendesak"],
];

export const STATUSES: [TaskStatus, string][] = [
  ["TODO", "Belum mulai"],
  ["IN_PROGRESS", "Dikerjakan"],
  ["COMPLETED", "Selesai"],
  ["CANCELLED", "Dibatalkan"],
];

export const PLATFORMS: [Platform, string][] = [
  ["GOOGLE_MEET", "Google Meet"],
  ["ZOOM", "Zoom"],
  ["TEAMS", "Microsoft Teams"],
  ["OTHER", "Lainnya"],
];

export const REMINDERS: [number, string][] = [
  [0, "Tepat waktu"],
  [5, "5 menit sebelum"],
  [10, "10 menit sebelum"],
  [30, "30 menit sebelum"],
  [60, "1 jam sebelum"],
  [1440, "1 hari sebelum"],
];

export function labelOf<T>(pairs: [T, string][], value: T): string {
  const hit = pairs.find((p) => String(p[0]) === String(value));
  return hit ? hit[1] : String(value);
}