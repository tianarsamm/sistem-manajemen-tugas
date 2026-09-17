"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Todo } from "@/lib/types";
import { uid } from "@/lib/utils";
import { TodoForm, TodoRow } from "@/components/todos";
import { Empty } from "@/components/ui";

const FILTERS: [string, string][] = [
  ["ALL", "Semua"],
  ["OPEN", "Terbuka"],
  ["DONE", "Selesai"],
];

export default function TodosPage() {
  const { data, loaded } = useStore();
  const [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState<Todo | null>(null);
  const [adding, setAdding] = useState(false);

  const list = data.todos
    .filter((t) => (filter === "OPEN" ? !t.done : filter === "DONE" ? t.done : true))
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) || (a.due || "9999").localeCompare(b.due || "9999"),
    );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">To-Do</h1>
          <p className="page-sub">Hal kecil yang cukup ditulis, dikerjakan, lalu dicoret.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          Tambah to-do
        </button>
      </div>

      <div className="toolbar">
        <div className="seg">
          {FILTERS.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)}>
              {l}
            </button>
          ))}
        </div>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          {data.todos.filter((t) => !t.done).length} belum selesai
        </span>
      </div>

      <div className="panel">
        {!loaded ? (
          <div className="skeleton">Memuat data…</div>
        ) : list.length ? (
          <ul className="list">
            {list.map((t) => (
              <TodoRow key={t.id} todo={t} onEdit={setEditing} />
            ))}
          </ul>
        ) : (
          <Empty title="Daftar masih kosong" hint="Gunakan tombol Tambah to-do untuk membuat item pertama." />
        )}
      </div>

      {adding ? (
        <TodoForm
          todo={{
            id: uid("d"),
            title: "",
            done: false,
            priority: "MEDIUM",
            due: "",
            category: "",
            createdAt: new Date().toISOString(),
          }}
          mode="add"
          onClose={() => setAdding(false)}
        />
      ) : null}
      {editing ? <TodoForm todo={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}