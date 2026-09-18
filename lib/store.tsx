"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type { AppData, Collection, MusicItem } from "./types";

const STORAGE_KEY = "fokus.v1";
const THEME_KEY = "fokus.theme";
const PRIMARY_COLOR_KEY = "fokus.primary-color";
const DEFAULT_PRIMARY_COLOR = "#2C6A4C";

const EMPTY: AppData = { tasks: [], todos: [], meetings: [], playlists: [], music: [] };

function applyPrimaryColor(color: string) {
  const root = document.documentElement;
  const hex = color.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  root.style.setProperty("--accent", color);
  root.style.setProperty("--accent-ink", luminance > 155 ? "#181D1A" : "#FFFFFF");
  root.style.setProperty("--accent-soft", `color-mix(in srgb, ${color} 16%, var(--surface))`);
}

type ConfirmRequest = {
  title: string;
  body: string;
  action: string;
  onConfirm: () => void;
} | null;

type StoreValue = {
  data: AppData;
  loaded: boolean;
  /** Tambah atau perbarui satu record berdasarkan id. */
  upsert: <K extends Collection>(coll: K, item: AppData[K][number]) => void;
  remove: (coll: Collection, id: string) => void;
  replaceData: (next: AppData) => void;
  resetAll: () => void;
  toast: (message: string) => void;
  confirm: (req: NonNullable<ConfirmRequest>) => void;
  // internal, dipakai Shell
  toastMessage: string | null;
  confirmRequest: ConfirmRequest;
  closeConfirm: () => void;
  // pemutar musik global
  playing: MusicItem | null;
  queuePosition: { index: number; total: number };
  play: (item: MusicItem) => void;
  step: (delta: number) => void;
  stopPlayer: () => void;
  theme: string;
  setTheme: (t: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [theme, setThemeState] = useState("auto");
  const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY_COLOR);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Muat sekali di klien supaya tidak bentrok dengan render server.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppData>;
        setData({
          tasks: parsed.tasks ?? [],
          todos: parsed.todos ?? [],
          meetings: parsed.meetings ?? [],
          playlists: parsed.playlists ?? [],
          music: parsed.music ?? [],
        });
      }
      const th = window.localStorage.getItem(THEME_KEY);
      if (th) {
        setThemeState(th);
        if (th !== "auto") document.documentElement.setAttribute("data-theme", th);
      }
      const savedPrimaryColor = window.localStorage.getItem(PRIMARY_COLOR_KEY);
      if (savedPrimaryColor) {
        setPrimaryColorState(savedPrimaryColor);
        applyPrimaryColor(savedPrimaryColor);
      }
    } catch {
      // localStorage bisa diblokir; aplikasi tetap jalan dengan data kosong.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // penyimpanan penuh atau ditolak — abaikan, data tetap ada di memori
    }
  }, [data, loaded]);

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const upsert = useCallback(<K extends Collection>(coll: K, item: AppData[K][number]) => {
    setData((prev) => {
      const list = prev[coll] as { id: string }[];
      const exists = list.some((x) => x.id === item.id);
      const next = exists
        ? list.map((x) => (x.id === item.id ? item : x))
        : [...list, item];
      return { ...prev, [coll]: next } as unknown as AppData;
    });
  }, []);

  const remove = useCallback((coll: Collection, id: string) => {
    setData((prev) => {
      const next = { ...prev };
      next[coll] = (prev[coll] as { id: string }[]).filter((x) => x.id !== id) as never;
      if (coll === "playlists") {
        next.music = prev.music.filter((m) => m.playlistId !== id);
      }
      return next;
    });
    setPlayingId((cur) => (cur === id ? null : cur));
  }, []);

  const replaceData = useCallback((next: AppData) => {
    setData(next);
    setPlayingId(null);
    setQueue([]);
  }, []);

  const resetAll = useCallback(() => {
    setData(EMPTY);
    setPlayingId(null);
    setQueue([]);
  }, []);

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    try {
      window.localStorage.setItem(THEME_KEY, t);
    } catch {
      // abaikan
    }
  }, []);

  const setPrimaryColor = useCallback((color: string) => {
    setPrimaryColorState(color);
    applyPrimaryColor(color);
    try {
      window.localStorage.setItem(PRIMARY_COLOR_KEY, color);
    } catch {
      // abaikan
    }
  }, []);

  const play = useCallback(
    (item: MusicItem) => {
      setQueue(data.music.filter((m) => m.playlistId === item.playlistId).map((m) => m.id));
      setPlayingId(item.id);
    },
    [data.music],
  );

  const step = useCallback(
    (delta: number) => {
      if (!queue.length || !playingId) return;
      const i = queue.indexOf(playingId);
      const next = (i + delta + queue.length) % queue.length;
      setPlayingId(queue[next]);
    },
    [queue, playingId],
  );

  const playing = useMemo(
    () => data.music.find((m) => m.id === playingId) ?? null,
    [data.music, playingId],
  );

  const queuePosition = useMemo(
    () => ({ index: playingId ? queue.indexOf(playingId) + 1 : 0, total: queue.length }),
    [queue, playingId],
  );

  const value: StoreValue = {
    data, loaded, upsert, remove, replaceData, resetAll,
    toast, toastMessage,
    confirm: setConfirmRequest, confirmRequest, closeConfirm: () => setConfirmRequest(null),
    playing, queuePosition, play, step, stopPlayer: () => setPlayingId(null),
    theme, setTheme, primaryColor, setPrimaryColor,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return ctx;
}