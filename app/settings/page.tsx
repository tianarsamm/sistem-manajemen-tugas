"use client";

import { useStore } from "@/lib/store";

const THEMES: [string, string][] = [
  ["auto", "Ikuti sistem"],
  ["light", "Terang"],
  ["dark", "Gelap"],
];

export default function SettingsPage() {
  const { data, loaded, theme, setTheme, resetAll, confirm, toast } = useStore();
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