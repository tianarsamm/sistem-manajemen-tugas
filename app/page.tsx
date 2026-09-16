"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { DOW, greeting, MON, today } from "@/lib/utils";
import { TaskForm, TaskRow } from "@/components/tasks";
import { TodoRow } from "@/components/todos";
import { MeetingCard } from "@/components/meetings";
import { Empty } from "@/components/ui";

export default function DashboardPage() {
  const { data, loaded } = useStore();
  const [creating, setCreating] = useState(false);

  if (!loaded) {
    return <div className="panel skeleton">Memuat data…</div>;
  }

  const t = today();
  const now = new Date();
  const done = data.tasks.filter((x) => x.status === "COMPLETED").length;
  const running = data.tasks.filter((x) => x.status === "TODO" || x.status === "IN_PROGRESS").length;

  const todayTasks = data.tasks.filter((x) => x.due === t && x.status !== "CANCELLED");
  const todayTodos = data.todos.filter((x) => x.due === t);
  const todayMeetings = data.meetings
    .filter((m) => m.date === t)
    .sort((a, b) => a.start.localeCompare(b.start));

  const deadlines = data.tasks
    .filter((x) => x.due && x.due >= t && x.status !== "COMPLETED" && x.status !== "CANCELLED")
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);

  const upcoming = data.meetings
    .filter((m) => m.date >= t)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 5);

  const totalToday = todayTasks.length + todayTodos.length + todayMeetings.length;
  const doneToday =
    todayTasks.filter((x) => x.status === "COMPLETED").length + todayTodos.filter((x) => x.done).length;
  const pct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;
  const circumference = 2 * Math.PI * 35;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{greeting(now.getHours())}</h1>
          <p className="page-sub">Semua yang perlu kamu urus hari ini ada di satu halaman.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          Tugas baru
        </button>
      </div>

      <section className="today">
        <div className="ring">
          <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
            <circle cx="43" cy="43" r="35" fill="none" stroke="var(--surface-3)" strokeWidth="7" />
            <circle
              cx="43" cy="43" r="35" fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * pct) / 100}
            />
          </svg>
          <div className="val">
            {pct}%<span>hari ini</span>
          </div>
        </div>
        <div>
          <div className="date">
            {DOW[now.getDay()]}, {now.getDate()} {MON[now.getMonth()]}
          </div>
          <p className="hint">
            {totalToday
              ? `${doneToday} dari ${totalToday} item hari ini sudah kelar — ${todayMeetings.length} rapat, ${todayTasks.length} tugas, ${todayTodos.length} to-do.`
              : "Belum ada yang dijadwalkan hari ini. Tambahkan tugas atau rapat untuk mulai."}
          </p>
        </div>
      </section>

      <section className="stats">
        <div className="stat"><b>{data.tasks.length}</b><span>Total tugas</span></div>
        <div className="stat"><b>{done}</b><span>Selesai</span></div>
        <div className="stat"><b>{running}</b><span>Berjalan</span></div>
        <div className="stat"><b>{data.todos.filter((x) => !x.done).length}</b><span>To-do terbuka</span></div>
      </section>

      <div className="grid2">
        <div className="panel">
          <div className="panel-head">
            <h3>Tugas hari ini</h3>
            <Link className="more" href="/tasks">Semua tugas</Link>
          </div>
          {todayTasks.length ? (
            <ul className="list">
              {todayTasks.map((t2) => <TaskRow key={t2.id} task={t2} />)}
            </ul>
          ) : (
            <Empty
              title="Tidak ada tugas jatuh tempo hari ini"
              hint="Nikmati ruang kosongnya, atau tarik maju pekerjaan besok."
            />
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>To-do hari ini</h3>
            <Link className="more" href="/todos">Semua to-do</Link>
          </div>
          {todayTodos.length ? (
            <ul className="list">
              {todayTodos.map((x) => <TodoRow key={x.id} todo={x} />)}
            </ul>
          ) : (
            <Empty title="Belum ada to-do hari ini" hint="To-do dipakai untuk hal cepat yang tidak perlu detail." />
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Rapat hari ini</h3>
            <Link className="more" href="/meetings">Semua rapat</Link>
          </div>
          {todayMeetings.length ? (
            todayMeetings.map((m) => <MeetingCard key={m.id} meeting={m} />)
          ) : (
            <Empty title="Hari tanpa rapat" hint="Waktu penuh untuk kerja dalam." />
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Tenggat terdekat</h3></div>
          {deadlines.length ? (
            <ul className="list">
              {deadlines.map((x) => <TaskRow key={x.id} task={x} />)}
            </ul>
          ) : (
            <Empty title="Tidak ada tenggat di depan" hint="Tugas dengan tanggal jatuh tempo akan muncul di sini." />
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Rapat berikutnya</h3></div>
          {upcoming.length ? (
            upcoming.map((m) => <MeetingCard key={m.id} meeting={m} />)
          ) : (
            <Empty title="Belum ada rapat terjadwal" hint="Buat rapat lalu simpan tautannya sekali saja." />
          )}
        </div>
      </div>

      {creating ? <TaskForm task={null} onClose={() => setCreating(false)} /> : null}
    </>
  );
}