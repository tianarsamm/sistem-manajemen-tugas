"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PRIORITIES, STATUSES, type Priority, type Task, type TaskStatus } from "@/lib/types";
import { TaskForm, TaskRow } from "@/components/tasks";
import { Empty } from "@/components/ui";

const RANK: Record<Priority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function TasksPage() {
  const { data, loaded } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TaskStatus | "ALL">("ALL");
  const [priority, setPriority] = useState<Priority | "ALL">("ALL");
  const [editing, setEditing] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.tasks
      .filter((t) => (status === "ALL" ? true : t.status === status))
      .filter((t) => (priority === "ALL" ? true : t.priority === priority))
      .filter((t) =>
        q ? `${t.title} ${t.desc} ${t.category}`.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => {
        const aDone = a.status === "COMPLETED" || a.status === "CANCELLED";
        const bDone = b.status === "COMPLETED" || b.status === "CANCELLED";
        if (aDone !== bDone) return aDone ? 1 : -1;
        if (!!a.due !== !!b.due) return a.due ? -1 : 1;
        if (a.due && b.due && a.due !== b.due) return a.due.localeCompare(b.due);
        return RANK[a.priority] - RANK[b.priority];
      });
  }, [data.tasks, query, status, priority]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(t: Task) {
    setEditing(t);
    setFormOpen(true);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tugas</h1>
          <p className="page-sub">Pekerjaan bertahap dengan subtugas, prioritas, dan tenggat.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          Tugas baru
        </button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          value={query}
          placeholder="Cari judul, catatan, kategori"
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | "ALL")}>
          <option value="ALL">Semua status</option>
          {STATUSES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "ALL")}>
          <option value="ALL">Semua prioritas</option>
          {PRIORITIES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{list.length} tugas</span>
      </div>

      <div className="panel">
        {!loaded ? (
          <div className="skeleton">Memuat data…</div>
        ) : list.length ? (
          <ul className="list">
            {list.map((t) => (
              <TaskRow key={t.id} task={t} expand onEdit={openEdit} />
            ))}
          </ul>
        ) : (
          <Empty
            title={data.tasks.length ? "Tidak ada yang cocok dengan filter" : "Belum ada tugas"}
            hint={
              data.tasks.length
                ? "Ubah kata kunci atau kembalikan filter ke semua."
                : "Mulai dari satu pekerjaan yang paling mengganggu pikiranmu."
            }
          />
        )}
      </div>

      {formOpen ? <TaskForm task={editing} onClose={() => setFormOpen(false)} /> : null}
    </>
  );
}