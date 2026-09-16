"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { AppData } from "@/lib/types";
import { DOW, fmtDate, MON, today, ymd } from "@/lib/utils";

type Mode = "month" | "week" | "day";
type Event = { kind: "task" | "todo" | "meet"; sort: string; label: string; done: boolean };

function eventsOn(data: AppData, date: string): Event[] {
  const out: Event[] = [];
  data.meetings
    .filter((m) => m.date === date)
    .forEach((m) => out.push({ kind: "meet", sort: m.start, label: `${m.start} ${m.title}`, done: false }));
  data.tasks
    .filter((x) => x.due === date && x.status !== "CANCELLED")
    .forEach((x) =>
      out.push({ kind: "task", sort: "zz", label: `Tugas: ${x.title}`, done: x.status === "COMPLETED" }),
    );
  data.todos
    .filter((x) => x.due === date)
    .forEach((x) => out.push({ kind: "todo", sort: "zz", label: `To-do: ${x.title}`, done: x.done }));
  return out.sort((a, b) => a.sort.localeCompare(b.sort));
}

export default function CalendarPage() {
  const { data, loaded } = useStore();
  const [mode, setMode] = useState<Mode>("month");
  const [cursor, setCursor] = useState(() => new Date());

  function move(step: number) {
    if (step === 0) return setCursor(new Date());
    const c = cursor;
    if (mode === "month") setCursor(new Date(c.getFullYear(), c.getMonth() + step, 1));
    else {
      const days = mode === "week" ? 7 : 1;
      setCursor(new Date(c.getFullYear(), c.getMonth(), c.getDate() + step * days));
    }
  }

  const title =
    mode === "month"
      ? `${MON[cursor.getMonth()]} ${cursor.getFullYear()}`
      : mode === "week"
        ? `Pekan ${fmtDate(ymd(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - cursor.getDay())))}`
        : fmtDate(ymd(cursor));

  function monthGrid() {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const s = ymd(d);
      const events = eventsOn(data, s);
      const cls = [
        "cal-cell",
        d.getMonth() !== cursor.getMonth() ? "out" : "",
        s === today() ? "today" : "",
      ].filter(Boolean).join(" ");
      cells.push(
        <div className={cls} key={s}>
          <div className="n">{d.getDate()}</div>
          {events.slice(0, 3).map((e, j) => (
            <div className={`ev ${e.kind}`} key={j} title={e.label}>
              {e.label}
            </div>
          ))}
          {events.length > 3 ? <div className="ev more">+{events.length - 3} lagi</div> : null}
        </div>,
      );
    }
    return (
      <div className="cal-grid">
        {DOW.map((d) => (
          <div className="cal-dow" key={d}>{d}</div>
        ))}
        {cells}
      </div>
    );
  }

  function dayList(count: number) {
    const start = new Date(cursor);
    if (count === 7) start.setDate(cursor.getDate() - cursor.getDay());
    const days = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const s = ymd(d);
      const events = eventsOn(data, s);
      days.push(
        <div className={s === today() ? "cal-day is-today" : "cal-day"} key={s}>
          <h4>
            {DOW[d.getDay()]}, {d.getDate()} {MON[d.getMonth()]}
          </h4>
          {events.length ? (
            events.map((e, j) => (
              <div className={`ev ${e.kind}`} key={j}>
                <span className={e.done ? "done-text" : undefined}>{e.label}</span>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Kosong</div>
          )}
        </div>,
      );
    }
    return <div className="cal-list">{days}</div>;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Kalender</h1>
          <p className="page-sub">Tugas, to-do, dan rapat dari aplikasi ini dalam satu tampilan.</p>
        </div>
      </div>

      <div className="cal-head">
        <div className="seg">
          <button type="button" aria-label="Sebelumnya" onClick={() => move(-1)}>‹</button>
          <button type="button" onClick={() => move(0)}>Hari ini</button>
          <button type="button" aria-label="Berikutnya" onClick={() => move(1)}>›</button>
        </div>
        <strong style={{ fontWeight: 500 }}>{title}</strong>
        <div className="seg" style={{ marginLeft: "auto" }}>
          {(
            [
              ["month", "Bulan"],
              ["week", "Pekan"],
              ["day", "Hari"],
            ] as [Mode, string][]
          ).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={mode === v} onClick={() => setMode(v)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {!loaded ? (
        <div className="panel skeleton">Memuat data…</div>
      ) : (
        <div className="scroll-x">
          {mode === "month" ? monthGrid() : dayList(mode === "week" ? 7 : 1)}
        </div>
      )}

      <div className="legend">
        <span><i className="dot" style={{ background: "var(--accent)" }} /> Rapat</span>
        <span><i className="dot" style={{ background: "var(--p-med)" }} /> Tugas</span>
        <span><i className="dot" style={{ background: "var(--p-high)" }} /> To-do</span>
      </div>
    </>
  );
}