"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { labelOf, PLATFORMS, REMINDERS, type Meeting } from "@/lib/types";
import { gcalLink, MON, parseYmd, today, uid } from "@/lib/utils";
import { Modal } from "./ui";

export function MeetingCard({ meeting, onEdit }: { meeting: Meeting; onEdit?: (m: Meeting) => void }) {
  const { upsert, remove, confirm, toast } = useStore();
  const d = parseYmd(meeting.date);

  return (
    <div className="mcard">
      <div className="mwhen">
        <b>{d.getDate()}</b>
        <span>{MON[d.getMonth()].slice(0, 3)}</span>
      </div>
      <div className="mbody">
        <div style={{ fontSize: 15 }}>{meeting.title}</div>
        <div className="meta" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 5 }}>
          <span className="tag">
            {meeting.start}–{meeting.end}
          </span>
          <span className="tag">{labelOf(PLATFORMS, meeting.platform)}</span>
          <span className="tag">{labelOf(REMINDERS, meeting.reminder)}</span>
          {meeting.gcalId ? <span className="tag ok">Sudah di Google Calendar</span> : null}
        </div>
        {meeting.desc ? (
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{meeting.desc}</div>
        ) : null}
      </div>
      <div className="macts">
        {meeting.url ? (
          <a className="btn btn-sm btn-primary" href={meeting.url} target="_blank" rel="noopener noreferrer">
            Gabung rapat
          </a>
        ) : null}
        <a
          className="btn btn-sm"
          href={gcalLink(meeting)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (!meeting.gcalId) {
              upsert("meetings", { ...meeting, gcalId: `gcal_${meeting.id}` });
              toast("Ditandai sudah masuk Google Calendar");
            }
          }}
        >
          {meeting.gcalId ? "Buka di Google" : "Tambah ke Google Calendar"}
        </a>
        {onEdit ? (
          <button type="button" className="icobtn" aria-label="Ubah rapat" onClick={() => onEdit(meeting)}>
            ✎
          </button>
        ) : null}
        <button
          type="button"
          className="icobtn"
          aria-label="Hapus rapat"
          onClick={() =>
            confirm({
              title: "Hapus rapat?",
              body: "Jadwal dan tautannya dihapus permanen.",
              action: "Hapus",
              onConfirm: () => {
                remove("meetings", meeting.id);
                toast("Rapat dihapus");
              },
            })
          }
        >
          🗑
        </button>
      </div>
    </div>
  );
}

type Draft = Omit<Meeting, "id" | "createdAt" | "gcalId">;

function toDraft(m: Meeting): Draft {
  return {
    title: m.title, desc: m.desc, date: m.date, start: m.start, end: m.end,
    platform: m.platform, url: m.url, reminder: m.reminder,
  };
}

export function MeetingForm({ meeting, onClose }: { meeting: Meeting | null; onClose: () => void }) {
  const { upsert, toast } = useStore();
  const [draft, setDraft] = useState<Draft>(
    meeting
      ? toDraft(meeting)
      : {
          title: "", desc: "", date: today(), start: "09:00", end: "10:00",
          platform: "GOOGLE_MEET", url: "", reminder: 10,
        },
  );
  const [showError, setShowError] = useState(false);

  const titleInvalid = !draft.title.trim();
  const timeInvalid = !draft.start || !draft.end || draft.end <= draft.start;
  const urlInvalid = !!draft.url && !/^https?:\/\//i.test(draft.url.trim());

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <Modal
      title={meeting ? "Ubah rapat" : "Rapat baru"}
      submitLabel={meeting ? "Simpan perubahan" : "Buat rapat"}
      onClose={onClose}
      onSubmit={() => {
        if (titleInvalid || timeInvalid || urlInvalid) {
          setShowError(true);
          return;
        }
        upsert("meetings", {
          id: meeting ? meeting.id : uid("m"),
          createdAt: meeting ? meeting.createdAt : new Date().toISOString(),
          gcalId: meeting ? meeting.gcalId : null,
          ...draft,
          title: draft.title.trim(),
          desc: draft.desc.trim(),
          url: draft.url.trim(),
        });
        toast(meeting ? "Rapat diperbarui" : "Rapat dibuat");
        onClose();
      }}
    >
      <div className={showError && titleInvalid ? "field invalid" : "field"}>
        <label className="f" htmlFor="mTitle">Judul</label>
        <input
          id="mTitle"
          type="text"
          value={draft.title}
          placeholder="Misalnya: Rapat situs klien"
          onChange={(e) => set("title", e.target.value)}
        />
        {showError && titleInvalid ? <div className="err">Judul wajib diisi.</div> : null}
      </div>

      <div className="field">
        <label className="f" htmlFor="mDesc">Agenda</label>
        <textarea
          id="mDesc"
          value={draft.desc}
          placeholder="Poin yang akan dibahas"
          onChange={(e) => set("desc", e.target.value)}
        />
      </div>

      <div className={showError && timeInvalid ? "row three field invalid" : "row three field"}>
        <div>
          <label className="f" htmlFor="mDate">Tanggal</label>
          <input id="mDate" type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <label className="f" htmlFor="mStart">Mulai</label>
          <input id="mStart" type="time" value={draft.start} onChange={(e) => set("start", e.target.value)} />
        </div>
        <div>
          <label className="f" htmlFor="mEnd">Selesai</label>
          <input id="mEnd" type="time" value={draft.end} onChange={(e) => set("end", e.target.value)} />
        </div>
        {showError && timeInvalid ? (
          <div className="err">Jam selesai harus setelah jam mulai.</div>
        ) : null}
      </div>

      <div className="row two field">
        <div>
          <label className="f" htmlFor="mPlatform">Platform</label>
          <select
            id="mPlatform"
            value={draft.platform}
            onChange={(e) => set("platform", e.target.value as Meeting["platform"])}
          >
            {PLATFORMS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="f" htmlFor="mReminder">Pengingat</label>
          <select
            id="mReminder"
            value={draft.reminder}
            onChange={(e) => set("reminder", Number(e.target.value))}
          >
            {REMINDERS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={showError && urlInvalid ? "field invalid" : "field"}>
        <label className="f" htmlFor="mUrl">Tautan rapat</label>
        <input
          id="mUrl"
          type="url"
          value={draft.url}
          placeholder="https://meet.google.com/…"
          onChange={(e) => set("url", e.target.value)}
        />
        {showError && urlInvalid ? (
          <div className="err">Tautan harus diawali http:// atau https://.</div>
        ) : null}
      </div>
    </Modal>
  );
}