"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { AppData } from "@/lib/types";

const PRIMARY_COLORS = [
  "#000000", "#555555", "#777777", "#A6A6A6", "#BDBDBD", "#D9D9D9", "#FFFFFF",
  "#FF3038", "#FF575B", "#F357B5", "#D89BE8", "#BD5FDD", "#8748F5", "#5615E5",
  "#0794AD", "#14B9D4", "#58D2D8", "#37ABEB", "#4B6FF2", "#0754AB", "#1807AE",
  "#00BF63", "#7AD957", "#B5FF6C", "#FFDE59", "#FFBD59", "#FF914D", "#FF641F",
];

const THEMES: [string, string][] = [
  ["auto", "Ikuti sistem"],
  ["light", "Terang"],
  ["dark", "Gelap"],
];

export default function SettingsPage() {
  const {
    data, loaded, theme, setTheme, primaryColor, setPrimaryColor,
    replaceData, resetAll, confirm, toast,
  } = useStore();
  const [draftPrimaryColor, setDraftPrimaryColor] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const selectedPrimaryColor = draftPrimaryColor ?? primaryColor;
  const total =
    data.tasks.length + data.todos.length + data.meetings.length +
    data.playlists.length + data.music.length;

  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fokus-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== "object") throw new Error("Format tidak valid");
        const candidate = parsed as Partial<AppData>;
        const collections = ["tasks", "todos", "meetings", "playlists", "music"] as const;
        if (collections.some((key) => !Array.isArray(candidate[key]))) {
          throw new Error("Koleksi data tidak lengkap");
        }
        replaceData(candidate as AppData);
        toast("Data berhasil dipulihkan");
      } catch {
        toast("File JSON tidak valid");
      }
    };
    reader.onerror = () => toast("File JSON tidak dapat dibaca");
    reader.readAsText(file);
  }

  function savePrimaryColor() {
    setPrimaryColor(selectedPrimaryColor);
    toast("Warna utama diperbarui");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-sub">Versi sederhana: tanpa akun, tanpa server sendiri.</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head"><h3>Tampilan</h3></div>
        <div style={{ padding: "15px 16px" }}>
          <div className="seg">
            {THEMES.map(([v, l]) => (
              <button key={v} type="button" aria-pressed={theme === v} onClick={() => setTheme(v)}>
                {l}
              </button>
            ))}
          </div>
          <div className="color-picker">
            <div className="color-picker-head">
              <strong>Warna solid default</strong>
              <span>Warna utama aplikasi</span>
            </div>
            <div className="color-grid" role="radiogroup" aria-label="Pilih warna utama">
              {PRIMARY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  aria-label={`Pilih warna ${color}`}
                  aria-pressed={selectedPrimaryColor === color}
                  onClick={() => setDraftPrimaryColor(color)}
                />
              ))}
            </div>
            <div className="color-picker-actions">
              <span>Warna terpilih: {selectedPrimaryColor}</span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={savePrimaryColor}
                disabled={selectedPrimaryColor === primaryColor}
              >
                Simpan warna
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Data</h3></div>
        <div style={{ padding: "15px 16px", display: "grid", gap: 11 }}>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13.5, maxWidth: "60ch" }}>
            Data disimpan di browser ini saja (localStorage), belum ada server maupun database.
            Menghapus data situs akan menghapus isinya.
            {loaded ? ` Saat ini ada ${total} catatan tersimpan.` : ""}
          </p>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={exportJson}>
              Unduh salinan JSON
            </button>
            <input
              ref={importInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importJson(file);
                e.target.value = "";
              }}
            />
            <button type="button" className="btn" onClick={() => importInput.current?.click()}>
              Pulihkan dari JSON
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() =>
                confirm({
                  title: "Hapus semua data?",
                  body: "Semua tugas, to-do, rapat, dan playlist akan hilang.",
                  action: "Hapus semua",
                  onConfirm: () => {
                    resetAll();
                    toast("Data dikosongkan");
                  },
                })
              }
            >
              Hapus semua data
            </button>
          </div>
        </div>
      </div>
    </>
  );
}