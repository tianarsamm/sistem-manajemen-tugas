"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Meeting } from "@/lib/types";
import { today } from "@/lib/utils";
import { MeetingCard, MeetingForm } from "@/components/meetings";
import { Empty } from "@/components/ui";

export default function MeetingsPage() {
  const { data, loaded } = useStore();
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const t = today();
  const upcoming = data.meetings
    .filter((m) => m.date >= t)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const past = data.meetings
    .filter((m) => m.date < t)
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
    .slice(0, 10);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Rapat</h1>
          <p className="page-sub">Simpan jadwal beserta tautannya, lalu gabung dengan satu ketukan.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Rapat baru
        </button>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head"><h3>Akan datang</h3></div>
        {!loaded ? (
          <div className="skeleton">Memuat data…</div>
        ) : upcoming.length ? (
          upcoming.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onEdit={(x) => {
                setEditing(x);
                setFormOpen(true);
              }}
            />
          ))
        ) : (
          <Empty title="Tidak ada rapat terjadwal" hint="Tambahkan rapat berikut platform dan tautannya." />
        )}
      </div>

      {past.length ? (
        <div className="panel">
          <div className="panel-head"><h3>Sudah lewat</h3></div>
          {past.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      ) : null}

      {formOpen ? <MeetingForm meeting={editing} onClose={() => setFormOpen(false)} /> : null}
    </>
  );
}